pipeline{
    agent any // Run on any available agent

    environment {
        DOCKERHUB_CREDENTIALS_ID = 'e09a699a-edc0-415a-a817-b4959eb2ef8e' // ID defined in Jenkins Credentials
        DOCKER_IMAGE_NAME = "hridaya43/weather-app" // Replace with your Docker Hub username
        KUBECONFIG_CREDENTIALS_ID = '' // We'll configure kubectl access differently for Minikube
        K8S_DEPLOYMENT_NAME = 'weather-app-deployment' // Matches metadata.name in deployment.yaml
        K8S_NAMESPACE = 'default' // Deploy to the default namespace
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm // Checks out the code from the repository configured in the Jenkins job
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${env.DOCKER_IMAGE_NAME}:latest"
                    // Use docker.build from Docker Pipeline plugin
                    def customImage = docker.build("${env.DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}", "--build-arg BUILD_INFO='Build-${env.BUILD_NUMBER}' .") // Pass build number as arg (optional)

                    // Also tag as latest
                    customImage.tag('latest')

                    echo "Docker image built successfully."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    echo "Pushing Docker image ${env.DOCKER_IMAGE_NAME} to Docker Hub..."
                    // Use docker.withRegistry from Docker Pipeline plugin
                    docker.withRegistry('https://registry.hub.docker.com', env.DOCKERHUB_CREDENTIALS_ID) {
                        // Push the build-number tagged image
                        docker.image("${env.DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}").push()

                        // Push the 'latest' tag
                        docker.image("${env.DOCKER_IMAGE_NAME}:latest").push()
                    }
                    echo "Docker image pushed successfully."
                }
            }
        }

        stage('Deploy to Kubernetes') {
            // This stage runs kubectl commands directly on the Jenkins agent,
            // assuming kubectl is installed and configured to talk to Minikube.
            // The jenkins user running this needs access to the KUBECONFIG or ~/.kube/config
            // Since we started minikube as the host user, and Jenkins runs as 'jenkins',
            // we might need to ensure the .kube/config is accessible or copy it.
            // An easier way for Minikube is often to run kubectl directly if installed on the agent.
            steps {
                echo "Deploying application to Kubernetes (Minikube)..."
                // Ensure kubectl uses the minikube context (usually set by 'minikube start')
                // If Jenkins runs in a container or different env, you might need 'withKubeConfig'
                sh "kubectl config use-context minikube"

                // Apply the deployment and service manifests from the workspace
                sh "kubectl apply -f deployment.yaml --namespace ${env.K8S_NAMESPACE}"
                sh "kubectl apply -f service.yaml --namespace ${env.K8S_NAMESPACE}"

                // Optional: Force rollout restart to pick up the 'latest' image if the tag didn't change
                // Using the BUILD_NUMBER tag directly in deployment.yaml is often better.
                // Or use kubectl set image command:
                // sh "kubectl set image deployment/${env.K8S_DEPLOYMENT_NAME} ${env.K8S_DEPLOYMENT_NAME}-container=${env.DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER} --namespace ${env.K8S_NAMESPACE}"
                sh "kubectl rollout status deployment/${env.K8S_DEPLOYMENT_NAME} --namespace ${env.K8S_NAMESPACE}"

                echo "Deployment successful."

                // Display service URL for Minikube
                sh "echo 'Access application via: ' && minikube service ${env.K8S_DEPLOYMENT_NAME}-service --url --namespace ${env.K8S_NAMESPACE}"
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
            // Clean up workspace? Optional.
            // cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
            // Add notification steps here (e.g., email, Slack)
        }
    }
}
