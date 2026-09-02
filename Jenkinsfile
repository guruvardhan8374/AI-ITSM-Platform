pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'ai-itsm-platform'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Validation') {
            steps {
                dir('backend') {
                    sh 'python3 -m compileall app'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Compose Validation') {
            steps {
                sh 'docker compose config'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy ITSM') {
            steps {
                sh 'docker compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for services..."
                    sleep 15

                    BACKEND=$(docker inspect itsm_backend --format "{{.State.Health.Status}}")
                    echo "Backend health: $BACKEND"

                    if [ "$BACKEND" != "healthy" ]; then
                        docker logs itsm_backend --tail 50
                        exit 1
                    fi

                    FRONTEND=$(docker inspect itsm_frontend --format "{{.State.Health.Status}}")
                    echo "Frontend health: $FRONTEND"

                    if [ "$FRONTEND" != "healthy" ]; then
                        docker logs itsm_frontend --tail 50
                        exit 1
                    fi

                    echo "All ITSM services are healthy."
                '''
            }
        }
    }

    post {
        success {
            echo 'AI-ITSM deployment completed successfully.'
        }

        failure {
            echo 'AI-ITSM pipeline failed. Check the stage logs.'
        }

        always {
            sh 'docker ps'
        }
    }
}
