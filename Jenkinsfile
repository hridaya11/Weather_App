pipeline {
    agent any // Run on any available agent

    environment {
        // Use the User-defined ID for your Docker Hub Credentials
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-creds'
        // Make sure this is your correct Docker Hub username and desired image name
        DOCKER_IMAGE_NAME        = "hridaya43/weather-app"
        K8S_DEPLOYMENT_NAME      = 'weather-app-deployment' // Matches metadata.name in deployment.yaml
        K8S_NAMESPACE            = 'default' // Deploy to the default namespace
        // KUBECONFIG_CREDENTIALS_ID is defined within the Deploy stage
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                // Checks out the code from the repository configured in the Jenkins job SCM section
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${env.DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                    // Use docker.build from Docker Pipeline plugin
                    def customImage = docker.build("${env.DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}", "--build-arg BUILD_INFO='Build-${env.BUILD_NUMBER}' .")

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
                    // Authenticates using the Jenkins credential specified by DOCKERHUB_CREDENTIALS_ID
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
            environment {
                 // Define the ID of the Secret File credential created in Jenkins containing the kubeconfig
                 KUBECONFIG_CREDENTIAL_ID = 'minikube-config'
            }
            steps {
                echo "Deploying application to Kubernetes (Minikube)..."
                // Use withKubeConfig to securely provide the kubeconfig file
                // Jenkins makes the file available at the path specified by the KUBECONFIG variable within this block
                // Ensure the 'Kubernetes CLI' plugin is installed in Jenkins
                withKubeConfig(credentialsId: env.KUBECONFIG_CREDENTIAL_ID) {
                    // Now kubectl commands inside this block will use the provided config

                    echo "Verifying Kubernetes connection using provided kubeconfig..."
                    sh "kubectl config current-context" // Should show 'minikube'
                    sh "kubectl get nodes" // Should list the minikube node

                    echo "Applying Kubernetes manifests..."
                    // Apply the deployment and service manifests from the workspace
                    sh "kubectl apply -f deployment.yaml --namespace ${env.K8S_NAMESPACE}"
                    sh "kubectl apply -f service.yaml --namespace ${env.K8S_NAMESPACE}"

                    echo "Checking deployment rollout status..."
                    // Wait for the deployment rollout to complete successfully
                    sh "kubectl rollout status deployment/${env.K8S_DEPLOYMENT_NAME} --namespace ${env.K8S_NAMESPACE} --timeout=2m"

                    echo "Deployment successful. Determining service access URL..."

                    // Get NodePort and Minikube IP for a more reliable URL in CI environment
                    sh "kubectl get service ${K8S_DEPLOYMENT_NAME}-service --namespace ${env.K8S_NAMESPACE} -o jsonpath='{.spec.ports[0].nodePort}' > nodeport.txt"
                    sh "minikube ip > minikubeip.txt"
                    script {
                        def nodePort = readFile('nodeport.txt').trim()
                        def minikubeIp = readFile('minikubeip.txt').trim()
                        if (nodePort && minikubeIp) {
                            echo "Access application via: http://${minikubeIp}:${nodePort}"
                        } else {
                            echo "Could not reliably determine Minikube service URL using NodePort/IP method."
                            // Fallback attempt - This might fail in Jenkins depending on environment
                            echo "Attempting fallback using 'minikube service --url'..."
                            sh "minikube service ${K8S_DEPLOYMENT_NAME}-service --url --namespace ${env.K8S_NAMESPACE} || echo 'Fallback command minikube service --url failed.'"
                        }
                    }
                    echo "Deployment stage complete."
                } // End of withKubeConfig block
            }
        }
    } // End of stages

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
    } // End of post
} // End of pipeline
