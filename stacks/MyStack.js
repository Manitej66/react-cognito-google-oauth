import * as sst from "@serverless-stack/resources";
import { Api, Auth, ViteStaticSite } from "@serverless-stack/resources";
import { aws_cognito as cognito, Duration } from "aws-cdk-lib";

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const auth = new Auth(this, "Auth", {
      cognito: {
        userPool: {
          userPoolName: "MyUserPool",
          selfSignUpEnabled: false,
        },
      },
    });

    const oAuth = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleOAuth",
      {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        userPool: auth.cognitoUserPool,
        attributeMapping: {
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        },
        scopes: ["profile", "email", "openid"],
      }
    );

    auth.cognitoUserPool.registerIdentityProvider(oAuth);

    const OAuthClient = auth.cognitoUserPool.addClient("GoogleOAuth", {
      generateSecret: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        callbackUrls: ["http://localhost:3000"],
        logoutUrls: ["http://localhost:3000"],
      },
      accessTokenValidity: Duration.days(1),
      refreshTokenValidity: Duration.days(1),
    });

    const domain = auth.cognitoUserPool.addDomain("MyDomain", {
      cognitoDomain: {
        domainPrefix: "manitej66-domain",
      },
    });

    // Create a HTTP API
    const api = new Api(this, "Api", {
      routes: {
        "GET /": "src/lambda.handler",
      },
    });

    auth.attachPermissionsForAuthUsers(["api"]);

    // Create a React Static Site
    const site = new ViteStaticSite(this, "Site", {
      path: "frontend",
      environment: {
        VITE_APP_COGNITO_DOMAIN: domain.domainName,
        VITE_APP_API_URL: api.url,
        VITE_APP_REGION: scope.region,
        VITE_APP_USER_POOL_ID: auth.cognitoUserPool.userPoolId,
        VITE_APP_IDENTITY_POOL_ID: auth.cognitoCfnIdentityPool.ref,
        VITE_APP_USER_POOL_CLIENT_ID: OAuthClient.userPoolClientId,
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      ApiEndpoint: api.url,
      authClientId: auth.cognitoUserPoolClient.userPoolClientId,
      domain: domain.domainName,
      site_url: site.url,
    });
  }
}
