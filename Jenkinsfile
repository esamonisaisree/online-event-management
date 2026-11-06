
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out EventHub source code'
            }
        }

        stage('Check Node.js') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Syntax Check') {
            steps {
                bat 'node --check server.js'
                bat 'node --check public/script.js'
            }
        }

        stage('Build Complete') {
            steps {
                echo 'EventHub build completed successfully!'
            }
        }
    }
}
