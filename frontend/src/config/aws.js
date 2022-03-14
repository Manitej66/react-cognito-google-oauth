import Amplify, { Auth } from "aws-amplify";

Amplify.configure({
  Auth: {
    region: import.meta.env.VITE_APP_REGION,

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    // Required only if it's different from Amazon Cognito Region
    identityPoolRegion: import.meta.env.VITE_APP_IDENTITY_POOL_ID,

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: false,

    // OPTIONAL - Hosted UI configuration
    oauth: {
      domain: import.meta.env.VITE_APP_AUTH_DOMAIN,
      scope: [
        "phone",
        "email",
        "profile",
        "openid",
        "aws.cognito.signin.user.admin",
      ],
      redirectSignIn: "http://localhost:3000/",
      redirectSignOut: "http://localhost:3000/",
      responseType: "code", // or 'token', note that REFRESH token will only be generated when the responseType is code
    },
  },
});

// You can get the current config object
export const currentConfig = Auth.configure();
