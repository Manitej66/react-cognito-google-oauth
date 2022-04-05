import {
  Api,
  ApiAuthorizationType,
  Auth,
  ViteStaticSite,
  Stack,
} from "@serverless-stack/resources";
import {
  ProviderAttribute,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
} from "aws-cdk-lib/aws-cognito";
import * as apigAuthorizers from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";

export default class MyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create auth
    const auth = new Auth(this, "Auth", {
      cognito: {
        userPoolClient: {
          supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
          oAuth: {
            callbackUrls: [
              scope.stage === "prod"
                ? "prodDomainNameUrl"
                : "http://localhost:3000",
            ],
            logoutUrls: [
              scope.stage === "prod"
                ? "prodDomainNameUrl"
                : "http://localhost:3000",
            ],
          },
        },
      },
    });

    if (
      !auth.cognitoUserPool ||
      !auth.cognitoUserPoolClient ||
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    ) {
      throw new Error("Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
    }

    const provider = new UserPoolIdentityProviderGoogle(this, "Google", {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      userPool: auth.cognitoUserPool,
      scopes: ["profile", "email", "openid"],
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL,
        givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
        profilePicture: ProviderAttribute.GOOGLE_PICTURE,
      },
    });

    auth.cognitoUserPoolClient.node.addDependency(provider);

    const domain = auth.cognitoUserPool.addDomain("AuthDomain", {
      cognitoDomain: {
        domainPrefix: `${scope.stage}-demo-auth-domain`,
      },
    });

    // Create a HTTP API
    const api = new Api(this, "Api", {
      defaultAuthorizer: new apigAuthorizers.HttpUserPoolAuthorizer(
        "Authorizer",
        auth.cognitoUserPool,
        {
          userPoolClients: [auth.cognitoUserPoolClient],
        }
      ),
      defaultAuthorizationType: ApiAuthorizationType.JWT,
      routes: {
        "GET /private": "src/private.handler",
        "GET /public": {
          function: "src/public.handler",
          authorizationType: ApiAuthorizationType.NONE,
        },
      },
    });

    // Allow authenticated users invoke API
    auth.attachPermissionsForAuthUsers([api]);

    // Create a React Static Site
    const site = new ViteStaticSite(this, "Site", {
      path: "frontend",
      environment: {
        VITE_APP_COGNITO_DOMAIN: domain.domainName,
        VITE_APP_API_URL: api.url,
        VITE_APP_REGION: scope.region,
        VITE_APP_USER_POOL_ID: auth.cognitoUserPool.userPoolId,
        VITE_APP_IDENTITY_POOL_ID: auth.cognitoCfnIdentityPool.ref,
        VITE_APP_USER_POOL_CLIENT_ID:
          auth.cognitoUserPoolClient.userPoolClientId,
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
