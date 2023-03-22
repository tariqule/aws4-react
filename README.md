# AWS4 React

AWS4 React Library is used to get AWS Signature.

## Installation

Use the package manager [npm](https://docs.npmjs.com/cli/v6/commands/npm-install) to install aws4-react.

```bash
npm i aws4-react

or
yarn add aws4-react
```

## Usage

```Typescript
import { AWSSign } from 'aws4-react';

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


// returns aws4 'signature'
  const signature = awsSign.getSignature();
// returns 'Authorization Header'
  const authorization = awsSign.getAuthHeader();
  const { Authorization } = authorization

Pass the Authorization header as follows:
`${Authorization}SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`

```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
