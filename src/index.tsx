import { Sha256 as jsSha256 } from '@aws-crypto/sha256-js';
import { SourceData } from '@aws-sdk/types';
import { toHex } from '@aws-sdk/util-hex-encoding';
import { parse, format } from 'url';
import { DateUtils } from './DateUtils';

const DEFAULT_ALGORITHM = 'AWS4-HMAC-SHA256';
const IOT_SERVICE_NAME = 'iotdevicegateway';

const encrypt = function(key: SourceData | undefined, src: SourceData) {
  const hash = new jsSha256(key);
  hash.update(src);
  return hash.digestSync();
};

const hash = function(src: string) {
  const arg = src || '';
  const hash = new jsSha256();
  hash.update(arg);
  return toHex(hash.digestSync());
};

const escape_RFC3986 = function(component: string) {
  return component.replace(/[!'()*]/g, function(c) {
    return (
      '%' +
      c
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()
    );
  });
};

const canonical_query = function(query: string | null) {
  if (!query || query.length === 0) {
    return '';
  }

  return query
    .split('&')
    .map(e => {
      const key_val = e.split('=');

      if (key_val.length === 1) {
        return e;
      } else {
        const reencoded_val = escape_RFC3986(key_val[1]);
        return key_val[0] + '=' + reencoded_val;
      }
    })
    .sort((a, b) => {
      const key_a = a.split('=')[0];
      const key_b = b.split('=')[0];
      if (key_a === key_b) {
        return a < b ? -1 : 1;
      } else {
        return key_a < key_b ? -1 : 1;
      }
    })
    .join('&');
};

const canonical_headers = function(headers: { [x: string]: string }) {
  if (!headers || Object.keys(headers).length === 0) {
    return '';
  }

  return (
    Object.keys(headers)
      .map(function(key) {
        return {
          key: key.toLowerCase(),
          value: headers[key] ? headers[key].trim().replace(/\s+/g, ' ') : '',
        };
      })
      .sort(function(a, b) {
        return a.key < b.key ? -1 : 1;
      })
      .map(function(item) {
        return item.key + ':' + item.value;
      })
      .join('\n') + '\n'
  );
};

const signed_headers = function(headers: {}) {
  return Object.keys(headers)
    .map(function(key) {
      return key.toLowerCase();
    })
    .sort()
    .join(';');
};

/**
 *
 * @param request - request object
 * @param request.method - HTTP method
 * @param request.url - URL
 * @param request.headers - HTTP headers
 * @param request.data - HTTP body
 * @returns
 */
const canonical_request = function(request: {
  method: any;
  url: any;
  headers: any;
  data: any;
}) {
  const url_info: any = parse(request.url);

  return [
    request.method || '/',
    encodeURIComponent(url_info.pathname).replace(/%2F/gi, '/'),
    canonical_query(url_info.query),
    canonical_headers(request.headers),
    signed_headers(request.headers),
    hash(request.data),
  ].join('\n');
};

const parse_service_info = function(request: {
  url: any;
  service?: any;
  region?: any;
}) {
  const url_info = parse(request.url),
    host = url_info.host || '';

  const matched = host.match(/([^\.]+)\.(?:([^\.]*)\.)?amazonaws\.com$/);
  let parsed = (matched || []).slice(1, 3);

  if (parsed[1] === 'es') {
    // Elastic Search
    parsed = parsed.reverse();
  }

  return {
    service: request.service || parsed[0],
    region: request.region || parsed[1],
  };
};

const credential_scope = function(d_str: string, region: any, service: any) {
  return [d_str, region, service, 'aws4_request'].join('/');
};

const string_to_sign = function(
  algorithm: string,
  canonical_request: string,
  dt_str: string,
  scope: string
) {
  return [algorithm, dt_str, scope, hash(canonical_request)].join('\n');
};

const get_signing_key = function(
  secret_key: string,
  d_str: SourceData,
  service_info: { service: any; region: any }
) {
  const k = 'AWS4' + secret_key,
    k_date = encrypt(k, d_str),
    k_region = encrypt(k_date, service_info.region),
    k_service = encrypt(k_region, service_info.service),
    k_signing = encrypt(k_service, 'aws4_request');

  return k_signing;
};

const get_signature = function(
  signing_key: SourceData | undefined,
  str_to_sign: SourceData
) {
  return toHex(encrypt(signing_key, str_to_sign));
};

const get_authorization_header = function(
  algorithm: string,
  access_key: string,
  scope: string,
  signed_headers: string,
  signature: string
) {
  return [
    algorithm + ' ' + 'Credential=' + access_key + '/' + scope,
    'SignedHeaders=' + signed_headers,
    'Signature=' + signature,
  ].join(', ');
};

/**
 * Sign a HTTP request, add 'Authorization' header to request param
 */
export class AWSSigner {
  /**
   * Sign a HTTP request, add 'Authorization' header to request param
   * @method sign
   * @memberof Signer
   * @static
   *
   * @param {object} request - HTTP request object
   * request: {
   *   method: GET | POST | PUT ...,
   *   url: ...,
   *   headers: { header1: ... },
   *   data: data
   * }
   *
   * @param {object} access_info - AWS access credential info
   * access_info: {
   *   access_key: ...,
   *   secret_key: ...,
   *   session_token: ...
   * }
   *
   * @param {object} [service_info] - AWS service type and region, optional,
   * if not provided then parse out from url
   * service_info: {
   *   service: ...,
   *   region: ...
   * }
   *
   * @returns {object} Signed HTTP request
   */
  static sign(
    request: {
      headers?: any;
      body?: any;
      data?: any;
      url: any;
      method?: any;
      service?: any;
      region?: any;
    },
    access_info: { session_token: any; secret_key: string; access_key: string },
    service_info?: {
      region: string;
      service: string;
    }
  ) {
    const headers = request.headers || {};
    const { url, method, body } = request;

    if (body && !request.data) {
      throw new Error(
        'The attribute "body" was found on the request object. Please use the attribute "data" instead.'
      );
    }

    // datetime string and date string
    const dt = DateUtils.getDateWithClockOffset();
    const dt_str = dt.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const d_str = dt_str.substr(0, 8);

    const url_info = parse(url);
    headers['host'] = url_info.host;
    headers['x-amz-date'] = dt_str;
    if (access_info.session_token) {
      headers['X-Amz-Security-Token'] = access_info.session_token;
    }

    // Task 1: Create a Canonical Request
    const request_str = canonical_request({ method, url, headers, data: body });

    // Task 2: Create a String to Sign
    const serviceInfo = service_info || parse_service_info({ url });
    const scope = credential_scope(
      d_str,
      serviceInfo.region,
      serviceInfo.service
    );
    const str_to_sign = string_to_sign(
      DEFAULT_ALGORITHM,
      request_str,
      dt_str,
      scope
    );

    // Task 3: Calculate the Signature
    const signing_key = get_signing_key(
      access_info.secret_key,
      d_str,
      serviceInfo
    );
    const signature = get_signature(signing_key, str_to_sign);

    // Task 4: Adding the Signing information to the Request
    const authorization_header = get_authorization_header(
      DEFAULT_ALGORITHM,
      access_info.access_key,
      scope,
      signed_headers(headers),
      signature
    );
    headers['Authorization'] = authorization_header;

    return { ...request, headers };
  }

  static signUrl(
    urlToSign: string,
    accessInfo: any,
    serviceInfo?: any,
    expiration?: number
  ): string;
  static signUrl(
    request: any,
    accessInfo: any,
    serviceInfo?: any,
    expiration?: number
  ): string;
  static signUrl(
    urlOrRequest: string | any,
    accessInfo: any,
    serviceInfo?: any,
    expiration?: number
  ): string {
    const {
      url,
      method = 'GET',
      body,
    }: {
      url: any;
      method: string;
      body: any;
    } = typeof urlOrRequest === 'object' ? urlOrRequest : { url: urlOrRequest };

    const now = DateUtils.getDateWithClockOffset()
      .toISOString()
      .replace(/[:\-]|\.\d{3}/g, '');
    const today = now.substr(0, 8);

    const { search, ...parsedUrl } = parse(url, true, true);
    const { host } = parsedUrl;
    const signedHeaders = { host };

    const { region, service } =
      serviceInfo || parse_service_info({ url: format(parsedUrl) });
    const credentialScope = credential_scope(today, region, service);

    const sessionTokenRequired =
      accessInfo.session_token && service !== IOT_SERVICE_NAME;
    const queryParams = {
      'X-Amz-Algorithm': DEFAULT_ALGORITHM,
      'X-Amz-Credential': [accessInfo.access_key, credentialScope].join('/'),
      'X-Amz-Date': now.substr(0, 16),
      ...(sessionTokenRequired
        ? { 'X-Amz-Security-Token': accessInfo.session_token }
        : {}),
      ...(expiration ? { 'X-Amz-Expires': `${expiration}` } : {}),
      'X-Amz-SignedHeaders': Object.keys(signedHeaders).join(','),
    };

    const canonicalRequest = canonical_request({
      method,
      url: format({
        ...parsedUrl,
        query: { ...parsedUrl.query, ...queryParams },
      }),
      headers: signedHeaders,
      data: body,
    });

    const stringToSign = string_to_sign(
      DEFAULT_ALGORITHM,
      canonicalRequest,
      now,
      credentialScope
    );

    const signing_key = get_signing_key(accessInfo.secret_key, today, {
      region,
      service,
    });
    const signature = get_signature(signing_key, stringToSign);

    const additionalQueryParams = {
      'X-Amz-Signature': signature,
      ...(accessInfo.session_token && {
        'X-Amz-Security-Token': accessInfo.session_token,
      }),
    };

    const result = format({
      protocol: parsedUrl.protocol,
      slashes: true,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: parsedUrl.pathname,
      query: { ...parsedUrl.query, ...queryParams, ...additionalQueryParams },
    });

    return result;
  }
}
