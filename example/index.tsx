// import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Signer } from '../.';

interface Header {
  data?: string;
  metho?: string;
  url?: string;
  headers?: {
    host?: string;
    'x-amz-date': string;
    Authorization: string;
  };
}

const App = () => {
  let params = {
    // data: JSON.stringify(body),
    method: 'GET',
    url:
      'https://z7hgc1k4qb.execute-api.us-east-1.amazonaws.com/master/batches',
  };
  let cred = {
    secret_key: 'kdjaskdjaksd',
    access_key: 'dkasndkjasjdkas',
    session_token: '',
  };

  console.log(cred);

  const serviceInfo = {
    region: 'us-east-1',
    service: 'execute-api',
  };
  const headers: Header = Signer.sign(params, cred, serviceInfo);

  return <div>{headers}</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
