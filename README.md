# Simple Web app with APIGW+Lambda backend with Github Action

This sets up a simple static Next frontend with Tailwindcss that's hosted on S3 with a Lambda and APIGW backend. Github Actions is used for CI/CD

## Initial setup

### Development environment.

Each developer gets their own development environment, which is a copy of the production system. To deploy the development environment follow these instructions. For the very first deployment, deploy the backend first and when that has completed, you deploy the frontend, since it's hosted behind the CDN that's set up in the backend.

#### Backend

_These steps set up a development environment on AWS. This is full-blown replica of the production workload that can be used by an individual developr to iterate on before merging new features and changes to the main branch._

1. [Install AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
2. Acquire credentials to the AWS account you want to use and ensure they are in your active environment.
3. Build artefact. In the `backend` directory, use sam to install all dependencies and build the deployment artefact

```
sam build
```

4. Deploy the backend to the development environment. The `samconfig.toml` contains parameters that will be automatically picked up by SAM, like cloudformation stack name and region etc. To deploy the cloudformation with those parameters, which is the standard approach, run

```
sam deploy
```

That deploys the cloudformation using the parameters. You can also manually update the parameters in the configuration file before running `sam deploy`, or run

```
sam deploy --guided
```

which let's you accept each existing parameter, or update parameters through a small "wixard". This command is typically run the **first** time a cloudformation stack is deployed, to set and/or update the parameters the stack is deployed with.

> [!NOTE]  
> Make note of the `S3 bucket name`, `CDN domain name` and the `API URL` which are outputs from the cloudformation stack

#### Frontend

_These steps build a static production artefact of the Next App, and deploys it to the live development environent_

0. Inject the `API URL` from the backend deployment into the .env file. This allows your application to access the API URL at `{process.env.NEXT_PUBLIC_API_URL}`

1. Build static React app:

```
npm run build
```

This build all static files and puts them in the `out` directory.

2. Upload the static artefacts to the S3 bucket, which is hosting the static web application:

```
aws s3 cp out/ s3://<INSERT BUCKET NAME YOU NOTED DOWN IN BACKEND DEPLOYMENT>/ --recursive
```

### Continuous Deployment with Github Actions

These are the one-time steps to set up continuous deployment from the main branch of the github repo, using Github actions.

1. Set up trust between Github Actions and the AWS account that will host the production workload. [Docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
2. Copy the ARN of the role you just created and paste into the 2 Github Actions workflow files. This role will be assumed by Github Actions, granting Github Actions permissions to do what the role says in your AWS account, for instance deploy cloudformation to create resources.
3. Check in the `.github` directory and the `backend` directory. This triggers deployment of the production backend and hosting using Github actions. Note the hosting `S3 bucket name`, `API URL`and `CDN domain name` from the cloudformation stack outputs.
4. In the github actions frontend workflow file,
   1. insert the bucket name in the `aws s3 cp` command to have github actions deploy future frontend changes to the correct bucket that's hosting the production frontend.
   2. insert the API URL of the production backend into the command that does "echo" into an environment file.
5. Check in the `frontend` directory.

### Hot-reload Lambda function

To hot-reload the Lambda (live-update "on save"), use

```
sam sync
```

This starts a "watcher" that watches for changes. If you update the Lambda function and save, it automatically syncs the changes to the live Lambda function. This is a great way to iterate on a Lambda function in a development environment.
