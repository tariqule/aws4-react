import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AWSSign } from '../.';

const App = () => {
  const awsSign = new AWSSign();
  awsSign.getAmzDate(new Date());
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
  const { Authorization } = awsSign.getAuthorization();
  const AuthorizationHeader = awsSign.retrieveAuthorizationHeader(
    Authorization,
    signature
  );
  console.log(AuthorizationHeader);
  return <div>{AuthorizationHeader}</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
