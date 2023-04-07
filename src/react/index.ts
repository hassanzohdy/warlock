import React from "react";
import ReactDOMServer from "react-dom/server";

export function render(reactElement: React.ReactElement | React.ComponentType) {
  if (typeof reactElement === "function") {
    reactElement = React.createElement(reactElement);
  }

  const output = ReactDOMServer.renderToString(reactElement);

  return output;
}
