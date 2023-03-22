export const ALGORITHM = 'AWS4-HMAC-SHA256';
export const UNSIGNABLE_HEADERS = [
  'authorization',
  'content-length',
  'user-agent',
  'expiresHeader',
];
export const AMAZON_HEADERS = {
  date: 'X-Amz-Date',
  expires: 'X-AMZ-Expires',
  algo: 'X-Amz-Algorithm',
  credential: 'X-Amz-Credential',
  signed: 'X-Amz-SignedHeaders',
  signature: 'X-Amz-Signature',
  contentSha256: 'X-Amz-Content-Sha256',
};
export const REQUIRED_OPTIONS_KEYS = [
  'method',
  'path',
  'service',
  'region',
  'headers',
  'body',
  'credentials',
];
export const REQUIRED_HEADERS = ['host'];
