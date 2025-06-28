"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

export default function SandpackPreview({ code }: { code: string }) {
  return (
    <Sandpack
      template="react-ts"
      files={{
        "/App.tsx": code,
      }}
      options={{
        showLineNumbers: true,
        showNavigator: true,
        wrapContent: true,
      }}
    />
  );
}
