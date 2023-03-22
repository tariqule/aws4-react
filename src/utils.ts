import crypto from 'crypto-js';
import moment from 'moment';

export class Util {
  static hmac(key: string, string: string, digest = ''): any {
    if (digest !== undefined && digest.toLowerCase() == 'hex') {
      return crypto.HmacSHA256(string, key).toString(crypto.enc.Hex);
    } else {
      return crypto.HmacSHA256(string, key);
    }
  }

  static getHexEncodedHash(string: string): any {
    return crypto.SHA256(string).toString(crypto.enc.Hex);
  }

  static uriEscape(string: string | number | boolean) {
    var output = encodeURIComponent(string);
    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

    // AWS percent-encodes some extra non-standard characters in a URI
    output = output.replace(/[*]/g, function(ch) {
      return (
        '%' +
        ch
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()
      );
    });

    return output;
  }

  static formatDateTime(datetimeString: any) {
    if (!moment(datetimeString).isValid()) throw 'Unacceptable datetime string'; // is warning message shows , please comment out moment.js line 850
    return moment(datetimeString)
      .toISOString()
      .replace(/[:\-]|\.\d{3}/g, '');
  }
}
