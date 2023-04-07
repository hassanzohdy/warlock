import { render } from "core/react";

function createHtmlPage(html: string): string {
  const styles: string[] = [];
  const links: string[] = [];
  const body = html.replace(
    /<style.*?<\/style>|<link.*?>/gims,
    (match: string) => {
      if (match.startsWith("<style")) {
        styles.push(match);
      } else {
        links.push(match);
      }
      return "";
    },
  );
  const head = `<head>${links.join("")}${styles.join("")}</head>`;
  return `<!doctype html><html>${head}<body>${body}</body></html>`;
}

export function renderMail(
  reactElement: React.ReactElement | React.ComponentType,
) {
  const content = render(reactElement);

  return createHtmlPage(content);
}
