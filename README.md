## AWS4 React

AWS4 React Library is used to get AWS Signature.

This library is to create a signed AWS API request in react or any js project.

## Installation

Use the package manager [npm](https://docs.npmjs.com/cli/v6/commands/npm-install) to install aws4-react.

```bash
npm i aws4-react

or
yarn add aws4-react
```

## Usage

```Typescript
import { AWSSigner } from 'aws4-react';

 let params = {
    data: JSON.stringify(body),
    method: 'GET',
    url:
      'https://example.com',
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

  const headers = AWSSigner.sign(params, cred, serviceInfo);

/* It returns
  {
  data?: string;
  metho?: string;
  url?: string;
  headers?: {
    host?: string;
    'x-amz-date': string;
    Authorization: string;
  };
}
 */

```

Now you can send the Authorization in the header as follows

## Example with RTK Query

```Typescript
const signedHeaders = AWSSigner.sign(params, cred, serviceInfo);
fetchBaseQuery({
    baseUrl: "example.com",
    prepareHeaders: (headers) => {
       const authHeader = signedHeaders.headers
        for (let key in authHeader) {
         headers.set(key, authHeader[key]);
      }
      return headers;
    },
  });
```

## Example with Axios

```Typescript
const signedHeaders = AWSSigner.sign(params, cred, serviceInfo);
  const authHeader = signedHeaders.headers
  axios.post('url', {"body":data}, {
    headers: {
    'Authorization': authHeader.Authorization
    }
  }
)
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
