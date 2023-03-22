/**
 * @author: Tariqule Khan <tariqule@gmail.com>
 * @license: MIT
 * @description: This is the main entry point for the library.
 */

import {
  ALGORITHM,
  AMAZON_HEADERS,
  REQUIRED_HEADERS,
  REQUIRED_OPTIONS_KEYS,
  UNSIGNABLE_HEADERS,
} from './constants';
import { Util } from './utils';

/**
 * @class AWSSign
 * @description
 * This class is used to generate the signature for AWS requests.
 * It is used by the AWSClient class.
 * @see AWSClient
 * @see https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
 */
export class AWSSign {
  method: string | undefined;
  pathName: string | undefined;
  queryString: string | undefined;
  service: any;
  headers: any;
  body: any;
  region: any;
  credentials: any;
  datetime: any;

  /**
   * Function to set the options for the request which is to be signed.
   * @method sign
   * @param {object} options
   * @param {string} options.method - HTTP method
   * @param {string} options.path - path of the request
   * @param {string} options.service - service name
   * @param {object} options.headers - headers of the request
   * @param {string} options.body - body of the request
   * @param {string} options.region - region of the request
   * @param {object} options.credentials - credentials of the request
   * @param {object} options.credentials - { AccessKeyId, SecretKey }
   * @example
   * ```TypeScript
   * let awsSign = new AWSSign();
   * awsSign.sign({
   *  method: 'GET',
   * path: '/?Action=ListUsers&Version=2010-05-08',
   * service: 'iam',
   * headers: {
   *  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
   * 'X-Amz-Date': '20150830T123600Z',
   * },
   * body: '',
   * region: 'us-east-1',
   * credentials: {
   * AccessKeyId: 'AKIDEXAMPLE',
   * SecretKet: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
   * },
   * });
   * ```
   */
  sign(options: {
    method: string;
    path: string;
    service: any;
    headers: any;
    body: any;
    region: any;
    credentials: any;
  }) {
    this.sanityCheckOptionsHeaders(options);
    this.method = options.method.toUpperCase();
    this.pathName = options.path.split('?')[0];
    this.queryString = this.reconstructQueryString(options.path.split('?')[1]);
    this.service = options.service;
    this.headers = options.headers;
    this.body = options.body;
    this.region = options.region;
    this.credentials = options.credentials;
  }

  /**
   * @method getCanonicalHeaders
   * @returns {string} canonical headers
   */
  getCanonicalString(): string {
    let parts = [];
    // pathname = this.pathName;
    parts.push(this.method);
    parts.push(this.pathName);
    parts.push(this.queryString); // query string
    parts.push(this.getCanonicalHeaders() + '\n');
    parts.push(this.getSignedHeaders());
    parts.push(this.hexEncodedBodyHash());
    return parts.join('\n');
  }

  /**
   * @method getStringToSign
   * @returns {string} string to sign for AWS request
   */
  getStringToSign(): string {
    let parts = [];
    parts.push(ALGORITHM);
    parts.push(this.datetime);
    parts.push(this.getCredentialString());
    parts.push(Util.getHexEncodedHash(this.getCanonicalString()));

    return parts.join('\n');
  }

  /**
   * @method getSigngetSignatureedHeaders
   * @returns {string} hex encoded body hash
   */
  getSignature(): string {
    let kDate = Util.hmac(`AWS4${this.credentials.SecretKey}`, this.getDate()),
      kRegion = Util.hmac(kDate, this.region),
      kService = Util.hmac(kRegion, this.service),
      kCredentials = Util.hmac(kService, 'aws4_request');

    return Util.hmac(kCredentials, this.getStringToSign(), 'hex');
  }

  /**
   * Function to get the Authorization header for the request.
   * @method getAuthorization
   * @returns {{Authorization: string}} Authorization header
   * @example
   * ```TypeScript
   * let authHeader = awsSign.getAuthorization();
   * // authHeader returns { Authorization: "" }
   * ```
   */
  getAuthorization(): { Authorization: string } {
    let header = `${ALGORITHM} Credential=${
      this.credentials.AccessKeyId
    }/${this.getCredentialString()}, SignedHeaders=${this.getSignedHeaders()}, Signature=${this.getSignature()}`;

    return { Authorization: header };
  }

  sanityCheckRequiredKeysFor(object: {}, keys: any[]): void {
    let missingKeys: any[] = [];
    if (typeof object !== 'object')
      throw 'first argument has to be a javascript object';
    if (Object.keys(object).length === 0)
      throw 'first argument cannot be an empty object';
    if (!Array.isArray(keys)) throw 'second argument has to be an array';
    if (keys.length == 0) throw 'second argument cannot be empty';

    let objKeys = Object.keys(object).map(key => {
      return key.toLowerCase();
    });
    keys.forEach(key => {
      if (objKeys.indexOf(key.toLowerCase()) === -1) missingKeys.push(key);
    });

    if (missingKeys.length > 0) {
      throw `Missing the following keys in options: ${missingKeys.join(' ')}`;
    }
  }

  sanityCheckOptionsHeaders(options: {
    credentials: any;
    headers: { [x: string]: any; date: undefined };
  }): void {
    this.sanityCheckRequiredKeysFor(options, REQUIRED_OPTIONS_KEYS);
    this.sanityCheckRequiredKeysFor(options.credentials, [
      'SecretKey',
      'AccessKeyId',
    ]);
    this.sanityCheckRequiredKeysFor(options.headers, REQUIRED_HEADERS);
    if (options.headers[AMAZON_HEADERS.date] === undefined) {
      if (options.headers.date === undefined) {
        throw `need either ${AMAZON_HEADERS.date} or date header`;
      } else {
        this.datetime = Util.formatDateTime(options.headers.date);
      }
    } else {
      this.datetime = Util.formatDateTime(options.headers[AMAZON_HEADERS.date]);
    }
  }

  reconstructQueryString(queryString: string | undefined): string {
    if (queryString === undefined) return '';
    let arr = queryString.split('&'); // split query to array
    let arr2 = arr.sort((a: string, b: string) => {
      // sort by key
      if (a.split('=')[0] > b.split('=')[0]) {
        return 1;
      } else if (a.split('=')[0] < b.split('=')[0]) {
        return -1;
      } else if (a.split('=')[1] > b.split('=')[1]) {
        return 1;
      } else if (a.split('=')[1] < b.split('=')[1]) {
        return -1;
      } else {
        return 0;
      }
    });

    return arr2
      .map((query: string) => {
        let name = query.split('=')[0],
          value = query.split('=')[1] || '';
        return Util.uriEscape(name) + '=' + Util.uriEscape(value);
      })
      .join('&');
  }

  getCredentialString(): string {
    let parts = [];
    parts.push(this.getDate());
    parts.push(this.region);
    parts.push(this.service);
    parts.push('aws4_request');
    return parts.join('/');
  }

  getCanonicalHeaders(): string {
    let headers = [];
    for (let key in this.headers) {
      headers.push([key, this.headers[key]]);
    }
    headers.sort(function(a, b) {
      return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
    });
    let parts: string[] = [];
    headers.forEach(item => {
      let key = item[0].toLowerCase();
      if (this.isSignableHeader(key)) {
        parts.push(
          key + ':' + this.getCanonicalHeaderValues(item[1].toString())
        );
      }
    }, this);
    return parts.join('\n');
  }

  getCanonicalHeaderValues(values: string): string {
    return values.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }

  isSignableHeader(key: string): boolean {
    if (key.toLowerCase().indexOf('x-amz-') === 0) return true;
    return UNSIGNABLE_HEADERS.indexOf(key) < 0;
  }

  getSignedHeaders(): string {
    let keys = [];
    for (let key in this.headers) {
      key = key.toLowerCase();
      if (this.isSignableHeader(key)) keys.push(key);
    }
    return keys.sort().join(';');
  }

  hexEncodedBodyHash(): any {
    if (this.service === 's3') {
      return 'UNSIGNED-PAYLOAD';
    } else if (this.headers['X-Amz-Content-Sha256']) {
      return this.headers['X-Amz-Content-Sha256'];
    } else {
      return Util.getHexEncodedHash(this.body || '');
    }
  }

  getDate(): any {
    return (this.datetime as any).slice(0, 8);
  }

  /**
   * @method getAmzDate
   * @param date
   * @returns
   * the date in the amz date format e.g 20230209T123600Z
   * @example
   * ```TypeScript
   * let amzDate = awsSign.getAmzDate(new Date());
   * // amzDate returns 20230209T123600Z
   * ```
   */
  getAmzDate(date: Date): any {
    return date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  }

  /**
   * @method retrieveAuthorizationHeader
   * @param authorization - the signed authorization header
   * @param signature - the signature
   * @returns
   * the authorization header with the signature
   * @example
   * ```TypeScript
   * let authorization = awsSign.getAuthorizationHeader();
   * let signature = awsSign.getSignature();
   * let authHeader = awsSign.retrieveAuthorizationHeader(authorization, signature);
   * // authHeader returns Authorization Header with the signature
   * ```
   */
  retrieveAuthorizationHeader(authorization: string, signature: string): any {
    return `${authorization}SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`;
  }
}
