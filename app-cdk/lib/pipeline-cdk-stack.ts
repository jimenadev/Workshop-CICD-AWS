import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface ConsumerProps extends cdk.StackProps {
  ecrRepository: ecr.Repository;
}


export class PipelineCdkStack  extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConsumerProps) {
    super(scope, id, props);

    // Recupera el secreto de GitHub
    const githubSecret = cdk.SecretValue.secretsManager('github/personal_access_token');

       // Define el pipeline
       const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
        pipelineName: 'MyPipeline',
        crossAccountKeys: false,
      });

    const codeBuild = new codebuild.PipelineProject(this, 'CodeBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.LARGE,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_test.yml'),
    });

    // Define los artefactos
    const sourceOutput = new codepipeline.Artifact();
    const unitTestOutput  = new codepipeline.Artifact();


    // Agrega la etapa de origen con GitHub
    pipeline.addStage({
      stageName: 'Checkout',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'jimenadev',
          repo: 'Workshop-CICD-AWS',
          branch: 'main',
          oauthToken: githubSecret, // AWS maneja la creación del Webhook
          output: sourceOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Code-Quality-Testing',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Unit-Test',
          project: codeBuild,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

  }
}
