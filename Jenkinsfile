pipeline {
  agent {
      kubernetes {
          cloud 'kubernetes'
          label 'build'
      }
  }
  stages {
      stage('Build') {
        steps {
          container('kaniko') {
          sh '''
          /kaniko/executor --context . \
              --context `pwd` \
              --dockerfile `pwd`/Dockerfile \
              --destination=harbor.k8s.spmservers.eu/discordbot/discordbot:v${BUILD_NUMBER}
          '''
          }
        }
      }

    stage('Deploy') {
      steps {
        container('kubectl') {
          withKubeConfig([serverUrl: 'https://kubernetes.default.svc']) {
            sh '''
              kubectl set image --namespace discordbot \
                deployment/bot-deployment \
                frontend=harbor.k8s.spmservers.eu/discordbot/discordbot:v${BUILD_NUMBER}
              '''
          }
        }
      }
    }
  }
}