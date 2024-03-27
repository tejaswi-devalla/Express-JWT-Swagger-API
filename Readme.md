# Project Running Instructions

## Installation of Dependencies

### Clone the Repository: git clone <repo_url>

Ensure all necessary dependencies are installed by executing the following command:

```bash
npm install axios bcrypt dotenv express jsonwebtoken nodemon sqlite sqlite3 swagger-jsdoc swagger-ui-express web3 yamljs
```

## Database Setup

To create the required table, run the following command:

```bash
node db.js
```

### Running the Server

Before running the server, make sure to replace 'INFURA_API_KEY' with your Infura API key.

Initiate the server using the following command:

```bash
nodemon app.js
```

Upon successful startup, the server will be accessible at: [http://localhost:3000/api-docs](http://localhost:3000/api-docs) with Swagger..
