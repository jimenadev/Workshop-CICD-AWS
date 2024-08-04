import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class PipelineCdkStack  extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Recupera el secreto de GitHub
    const githubSecret = cdk.SecretValue.secretsManager('github/personal_access_token');

       // Define el pipeline
       const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
        pipelineName: 'MyPipeline',
        crossAccountKeys: false,
      });

    // Crea un proyecto de CodeBuild
   /* const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('./buildspec.yml'),
    });*/
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

    // Agrega la etapa de construcción
    /*pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: codeBuild,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });*/

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
