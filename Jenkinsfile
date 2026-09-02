<<<<<<< HEAD
@'
=======
>>>>>>> 09eba65 (Add Docker deployment and Jenkins CI/CD)
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
                    powershell '''
                        python -m compileall app
                    '''
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    powershell '''
                        npm ci
                        npm run build
                    '''
                }
            }
        }

        stage('Docker Compose Validation') {
            steps {
                powershell '''
                    docker compose config
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                powershell '''
                    docker compose build
                '''
            }
        }

        stage('Deploy ITSM') {
            steps {
                powershell '''
                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                powershell '''
                    Start-Sleep -Seconds 15

                    $backend = docker inspect itsm_backend --format "{{.State.Health.Status}}"
                    Write-Host "Backend health: $backend"

                    if ($backend -ne "healthy") {
                        docker logs itsm_backend --tail 50
                        exit 1
                    }

                    $frontend = docker inspect itsm_frontend --format "{{.State.Health.Status}}"
                    Write-Host "Frontend health: $frontend"

                    if ($frontend -ne "healthy") {
                        docker logs itsm_frontend --tail 50
                        exit 1
                    }
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
            powershell '''
                docker ps
            '''
        }
    }
<<<<<<< HEAD
}
'@ | Set-Content -Path .\Jenkinsfile -Encoding UTF8
=======
}
>>>>>>> 09eba65 (Add Docker deployment and Jenkins CI/CD)
