import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AWSSign } from '../.';
import axios from 'axios';

const App = () => {
  const awsSign = new AWSSign();

  const options = {
    path: '/',
    method: 'get',
    service: 'apigateway.amazonaws.com',
    headers: {
      'X-Amz-Date': '20230209T123600Z',
      host: '.amazonaws.com',
    },
    region: 'us-east-1',
    body: '',
    credentials: {
      SecretKey: '987890',
      AccessKeyId: '7890',
    },
  };
  awsSign.sign(options);
  const signature = awsSign.getSignature();
  const authorization = awsSign.getAuthHeader();

  console.log('signature => ', signature);
  console.log(
    'authorization => ',
    `${authorization.Authorization}SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`
  );

  return <div>Test</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
