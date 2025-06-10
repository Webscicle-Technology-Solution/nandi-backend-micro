const { logger } = require("../utils/logger");
const proxy = require("express-http-proxy");
const { proxyOptionsV1 } = require("../config/proxyOptions");

function isMultipartRequest(req) {
  return (
    req.headers["content-type"] &&
    req.headers["content-type"].includes("multipart/form-data")
  );
}

const proxyMiddleware = function () {
  return function (req, res, next) {
    let reqAsBuffer = false;
    let reqBodyEncoding = true;
    let parseReqBody = true;
    let contentTypeHeader = req.headers["content-type"];

    // Log incoming headers for debugging
    logger.info("[API-Gateway] Received headers:", req.headers);

    // Check if the request is multipart
    if (isMultipartRequest(req)) {
      reqAsBuffer = true; // Treat the request body as a raw buffer
      reqBodyEncoding = null; // Don't specify a body encoding (binary)
      parseReqBody = false; // Prevent the proxy from parsing the body
    }

    // Log the request body (be careful with large files, this might not be feasible for very large bodies)
    logger.info("[API-Gateway] Received body (partial):", req.body);

    // Now apply the proxy with the custom options
    return proxy(process.env.ADMIN_UPLOAD_SERVICE_URL, {
      ...proxyOptionsV1,
      reqAsBuffer, // Ensure the request body is handled as raw binary
      reqBodyEncoding, // Keep the original encoding (null if binary)
      parseReqBody, // Set to false for multipart requests

      // Modify the proxy request options (headers, etc.)
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // Log proxy request headers
        logger.info("[Proxy] Proxying with headers:", proxyReqOpts.headers);

        proxyReqOpts.headers["Content-Type"] = contentTypeHeader; // Set content type for multipart
        return proxyReqOpts;
      },

      // Modify the request body before sending it to the backend
      proxyReqBodyDecorator: (body, req) => {
        logger.info("[Proxy] Request body being sent to backend:", body); // Log body for debugging
        return body; // You can modify the body here if needed
      },

      // Optionally filter requests based on certain criteria
      filter: function (req, res) {
        // Add custom filter logic if needed
        return true; // Allow the request to be proxied
      },

      // Handle response from the backend
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(
          "[Proxy] Response received from upload service:",
          proxyRes.statusCode
        );

        try {
          let responseBody = JSON.parse(proxyResData.toString("utf-8"));
          // Handle response modifications, if necessary
          return JSON.stringify(responseBody);
        } catch (error) {
          logger.error("[Proxy] Error parsing response:", error);
          return proxyResData; // Return the raw response if parsing fails
        }
      },
    })(req, res, next); // Continue the request to the backend service
  };
};

module.exports = { proxyMiddleware };
