import React, { useEffect, useRef } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { placeholder } from '@codemirror/view';
import PropTypes from 'prop-types';

// Simple JSON linter
const jsonLinter = linter(view => {
  const diagnostics = [];
  const text = view.state.doc.toString();

  if (!text.trim()) return diagnostics;

  try {
    JSON.parse(text);
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Try to find position from error message
      const match = e.message.match(/position (\d+)/);
      const pos = match ? parseInt(match[1], 10) : text.length;

      diagnostics.push({
        from: Math.max(0, Math.min(pos, text.length)),
        to: Math.max(0, Math.min(pos + 1, text.length)),
        severity: 'error',
        message: e.message
      });
    }
  }

  return diagnostics;
});

const JsonEditor = ({ value, onChange, label, headerActions, error, placeholderText, readOnly }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: value || '',
      extensions: [
        basicSetup,
        json(),
        jsonLinter,
        EditorView.lineWrapping,
        EditorView.editable.of(!readOnly),
        readOnly ? EditorState.readOnly.of(true) : [],
        placeholderText ? placeholder(placeholderText) : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange && !readOnly) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          },
          '&.cm-focused': {
            outline: 'none',
          },
          '.cm-scroller': {
            fontFamily: 'monospace',
            height: '484px',
            overflowX: 'auto',
            overflowY: 'auto',
          },
          '.cm-content': {
            minHeight: '484px',
          },
          '.cm-gutters': {
            backgroundColor: '#f7fafc',
            borderRight: '1px solid #e2e8f0',
          },
          '.cm-content': {
            padding: '8px 0',
          },
          '.cm-line': {
            padding: '0 8px',
          },
          '.cm-panel.cm-panel-lint': {
            backgroundColor: '#fff5f5',
            borderTop: '1px solid #fc8181',
            padding: '8px 12px',
            fontSize: '13px',
          },
          '.cm-diagnostic': {
            padding: '4px 8px',
            margin: '2px 0',
            borderLeft: '3px solid #e53e3e',
            backgroundColor: '#fff',
            borderRadius: '4px',
          },
          '.cm-diagnostic-error': {
            borderLeftColor: '#e53e3e',
          },
          '.cm-diagnosticText': {
            color: '#2d3748',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          '.cm-diagnosticAction': {
            display: 'none',
          },
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update editor when value changes externally
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value || '',
        },
      });
    }
  }, [value]);

  return (
    <Box mt="-7px" maxW="100%" overflow="hidden">
      {(label || headerActions) && (
        <HStack justify="space-between" align="center" mt={2} mb={1} gap={1}>
          {label && (
            <Text fontSize="sm" fontWeight="medium">
              {label}
            </Text>
          )}
          {headerActions}
        </HStack>
      )}
      <Box ref={editorRef} />
      {/* {error && (
        <Text fontSize="xs" color="red.600" mt={1}>
          {error}
        </Text>
      )} */}
    </Box>
  );
};

JsonEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  headerActions: PropTypes.node,
  error: PropTypes.string,
  placeholderText: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default JsonEditor;
