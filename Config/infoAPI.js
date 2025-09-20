const express = require('express');
const router = express.Router();

// GET /info
// This endpoint provides a detailed explanation of APIs and includes all available routes.
router.get('/info', (req, res) => {
  const infoData = {
    "api": {
      "name": "Multi-Agent AI Backend API",
      "version": "1.0.0",
      "description": "An educational API that provides information on what APIs are, how to use them, and the workflow of a request-response cycle. It also includes a full list of the available routes for this multi-agent backend."
    },
   
    "howItWorks": {
      "title": "The API Workflow: A Step-by-Step Guide",
      "steps": [
        {
          "step": 1,
          "name": "The Request ➡️",
          "description": "You, the client (e.g., a web browser, a mobile app, or a server), send a **request** to a specific API endpoint. This request contains information about what you want. This often includes a **URL**, an **HTTP method** (like GET, POST, PUT, DELETE), and sometimes a **body** with data."
        },
        {
          "step": 2,
          "name": "The API Gateway 🚪",
          "description": "The request arrives at the API's server. The server's **router** (a piece of code) reads the request's URL and method to determine which internal function (the **controller**) should handle it."
        },
        {
          "step": 3,
          "name": "The Processing ⚙️",
          "description": "The controller executes the necessary business logic. This could involve reading or writing data from a **database**, communicating with other services, or performing calculations. For example, a request to 'get all users' would trigger the controller to fetch data from the `users` table in a database."
        },
        {
          "step": 4,
          "name": "The Response ⬅️",
          "description": "After processing, the server sends a **response** back to the client. This response typically includes a **status code** (e.g., `200 OK` for success, `404 Not Found` for an error) and a **response body** containing the requested data, usually in **JSON** or XML format."
        }
      ]
    },
    "routes": {
      "title": "API Routes & Usage",
      "description": "This is a list of all available API endpoints for this backend. The base URL for all routes is `/api`.",
      "list": [
        {
          "endpoint": "POST /api/users",
          "description": "Creates a new user.",
          "usage": {
            "method": "POST",
            "body": {
              "username": "string",
              "email": "string"
            },
            "response": "Returns the new user's ID."
          }
        },
        {
          "endpoint": "GET /api/users/:id",
          "description": "Retrieves a user's information by their ID.",
          "usage": {
            "method": "GET",
            "path_params": {
              "id": "string (the user's MongoDB ObjectId)"
            },
            "response": "Returns the user object."
          }
        },
        {
          "endpoint": "POST /api/session/start",
          "description": "Starts a new multi-agent session.",
          "usage": {
            "method": "POST",
            "body": {
              "userIdea": "string",
              "userId": "string (the user's ObjectId)"
            },
            "response": "Returns the newly created sessionId."
          }
        },
        {
          "endpoint": "POST /api/agents/clarifier",
          "description": "Runs the Clarifier Agent to generate clarifying questions.",
          "usage": {
            "method": "POST",
            "body": {
              "sessionId": "string",
              "userIdea": "string"
            },
            "response": "Returns clarifying questions and draft requirements."
          }
        },
        {
          "endpoint": "POST /api/agents/conflict-resolver",
          "description": "Analyzes requirements for logical contradictions.",
          "usage": {
            "method": "POST",
            "body": {
              "sessionId": "string"
            },
            "response": "Returns identified conflicts and resolution options."
          }
        },
        {
          "endpoint": "POST /api/agents/validator",
          "description": "Checks the feasibility of the requirements.",
          "usage": {
            "method": "POST",
            "body": {
              "sessionId": "string"
            },
            "response": "Returns a feasibility report and risk level."
          }
        },
        {
          "endpoint": "POST /api/agents/prioritizer",
          "description": "Organizes requirements into a structured roadmap.",
          "usage": {
            "method": "POST",
            "body": {
              "sessionId": "string"
            },
            "response": "Returns a prioritized list of features (must-have, should-have, etc.)."
          }
        },
        {
          "endpoint": "GET /api/session/:id/blueprint",
          "description": "Retrieves the final project blueprint document.",
          "usage": {
            "method": "GET",
            "path_params": {
              "id": "string (the session's ObjectId)"
            },
            "response": "Returns a merged document from all agent outputs."
          }
        }
      ]
    },
    "conclusion": "By understanding this basic workflow and the provided routes, you can begin to interact with this backend to build dynamic and data-rich applications."
  };

  res.json(infoData);
});

module.exports = router;