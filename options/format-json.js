const formatJson = (function getFormatter() {
  const getIndent = symbol => (count) => {
    let indent = '';
    for (let i = 0; i < count; i += 1) {
      indent += symbol;
    }

    return indent;
  };

  const getSpacing = (counter) => {
    const spacing = `\n${getIndent('    ')(counter)}`;
    return spacing;
  };

  return (json) => {
    let i = 0;
    let openCurlyBraceCounter = 0;
    let quoteCounter = 0;
    let formatted = '';

    while (i < json.length) {
      const currentChar = json[i];
      const nextChar = json[i + 1];
      formatted += currentChar;
      if (currentChar === '"') {
        quoteCounter += 1;
      }

      if (!(quoteCounter % 2)) {
        if (currentChar === '{') {
          openCurlyBraceCounter += 1;
          formatted += getSpacing(openCurlyBraceCounter);
        } else if (currentChar === '}') {
          openCurlyBraceCounter -= 1;
          if (nextChar === ']' || nextChar === ',') {
            formatted += nextChar;
            i += 1;
          }
          formatted += getSpacing(openCurlyBraceCounter);
        } else if (currentChar === ',') {
          formatted += getSpacing(openCurlyBraceCounter);
        }
      }

      i += 1;
    }

    return formatted;
  };
}());
