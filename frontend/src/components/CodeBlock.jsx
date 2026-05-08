import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

const CodeBlock = ({ children, className }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [children]);

  // Extract language from className (format: language-xxx)
  const language = className ? className.replace('language-', '') : 'javascript';

  return (
    <pre className={`language-${language}`}>
      <code className={`language-${language}`}>{children}</code>
    </pre>
  );
};

export default CodeBlock;
