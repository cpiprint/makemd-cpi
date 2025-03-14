import { EditorView } from "@codemirror/view";
import { toggleMark } from "basics/menus/inlineStylerView/marks";
import classNames from "classnames";

import { getActiveCM, getActiveMarkdownView } from "basics/codemirror";
import { i18n } from "makemd-core";

import MakeBasicsPlugin from "basics/basics";
import { uiIconSet } from "core/assets/icons";
import { editorInfoField } from "obsidian";
import React, { useState } from "react";
import { colors } from "schemas/color";
import { sanitizeFileName } from "utils/sanitizers";
import { Mark } from "./Mark";
import { InlineStyle, resolveStyles } from "./styles";

export const loadStylerIntoContainer = (
  el: HTMLElement,
  plugin: MakeBasicsPlugin
) => {
  const root = plugin.createRoot(el);
  root.render(
    <InlineMenuComponent
      mobile={true}
      activeMarks={[]}
      plugin={plugin}
    ></InlineMenuComponent>
  );
};

export const InlineMenuComponent: React.FC<{
  cm?: EditorView;
  activeMarks: string[];
  mobile: boolean;
  plugin: MakeBasicsPlugin;
}> = (props) => {
  const [mode, setMode] = useState(props.mobile ? 0 : 1);
  const [colorMode, setColorMode] = useState<{
    prefix: string;
    suffix: string;
    closeTag: string;
  } | null>(null);

  const makeMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const cm = props.cm ?? getActiveCM(props.plugin);
    if (!cm) return;
    const end = cm.state.selection.main.to;
    const insertChars =
      cm.state.sliceDoc(end - 1, end) == cm.state.lineBreak
        ? props.plugin.settings.menuTriggerChar
        : cm.state.lineBreak + props.plugin.settings.menuTriggerChar;
    cm.dispatch({
      changes: {
        from: end,
        to: end,
        insert: insertChars,
      },
      selection: {
        head: end + insertChars.length,
        anchor: end + insertChars.length,
      },
    });
  };
  const toggleMarkAction = (e: React.MouseEvent, s: InlineStyle) => {
    e.preventDefault();
    const cm = props.cm ?? getActiveCM(props.plugin);
    if (!cm) return;
    if (s.mark) {
      cm.dispatch({
        annotations: toggleMark.of(s.mark),
      });
      return;
    }
    const selection = cm.state.selection.main;
    const selectedText = cm.state.sliceDoc(selection.from, selection.to);
    // cm.focus();
    cm.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert:
          s.value.substring(0, s.insertOffset) +
          selectedText +
          s.value.substring(s.insertOffset),
      },
      selection: s.cursorOffset
        ? {
            anchor:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length +
              s.cursorOffset,
            head:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length +
              s.cursorOffset,
          }
        : {
            anchor:
              selection.from + s.value.substring(0, s.insertOffset).length,
            head:
              selection.from +
              s.value.substring(0, s.insertOffset).length +
              selectedText.length,
          },
    });
  };

  const makeMode = () => (
    <>
      <div
        aria-label={
          !props.plugin.isTouchScreen() ? i18n.commands.makeMenu : undefined
        }
        onMouseDown={(e) => {
          makeMenu(e);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-slash"],
        }}
      ></div>
      <div
        aria-label={
          !props.plugin.isTouchScreen() ? i18n.commands.selectStyle : undefined
        }
        onMouseDown={() => {
          setMode(1);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-style"],
        }}
      ></div>
      <div
        aria-label={
          !props.plugin.isTouchScreen() ? i18n.commands.image : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:attach-file"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-attach"],
        }}
      ></div>
      <div
        aria-label={
          !props.plugin.isTouchScreen()
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:indent-list"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-indent"],
        }}
      ></div>
      <div
        aria-label={
          !props.plugin.isTouchScreen()
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:unindent-list"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-unindent"],
        }}
      ></div>
      <div
        aria-label={
          !props.plugin.isTouchScreen()
            ? i18n.commands.toggleKeyboard
            : undefined
        }
        onMouseDown={() => {
          const view = getActiveMarkdownView(props.plugin);
          props.plugin.app.commands.commands[
            "editor:toggle-keyboard"
          ].editorCallback(view.editor, view);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-make-keyboard"],
        }}
      ></div>
    </>
  );

  const colorsMode = () => (
    <>
      <div
        className="mk-mark"
        onMouseDown={() => {
          setColorMode(null);
          setMode(1);
        }}
        dangerouslySetInnerHTML={{
          __html: uiIconSet["close"],
        }}
      ></div>
      {colors.map((c, i) => (
        <div
          key={i}
          onMouseDown={() => {
            setMode(1);
            setColorMode(null);
            const cm = props.cm ?? getActiveCM(props.plugin);
            if (!cm) return;
            const selection = cm.state.selection.main;
            const selectedText = cm.state.sliceDoc(
              selection.from,
              selection.to
            );
            cm.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert:
                  colorMode.prefix +
                  c[1] +
                  colorMode.suffix +
                  selectedText +
                  colorMode.closeTag,
              },
            });
          }}
          className="mk-color"
          style={{ background: c[1] }}
        ></div>
      ))}
    </>
  );

  function getMarkdownListIndentLevel(line: string): number {
    const regex = /^(\s*)(-|\d+\.)\s+(\[[ x]\]\s+)?/;
    const match = line.match(regex);

    if (match) {
      return match[1].length;
    }

    return -1; // Return -1 if it's not a list item
  }
  function unindentText(text: string, levels: number) {
    // Function to create a regex that matches spaces or tabs
    const createIndentRegex = (count: number) => {
      return new RegExp(`^([\\t]|[ ]{2,4}){0,${count}}`, "gm");
    };

    const regex = createIndentRegex(levels);

    return text.replace(regex, "");
  }
  function removeListFormatting(text: string) {
    const regex = /^(\s*)([-*+]|\d+\.)\s+(\[[ x]\]\s+)?/gm;
    return text.replace(regex, "");
  }
  const transformMultiline = async () => {
    const firstLine = props.cm.state.doc.lineAt(
      props.cm.state.selection.main.from
    );
    const startIndent = getMarkdownListIndentLevel(
      props.cm.state.sliceDoc(firstLine.from, firstLine.to)
    );
    const lineStart = props.cm.state.doc.lineAt(
      props.cm.state.selection.main.from
    ).number;
    const lineEnd = props.cm.state.doc.lineAt(
      props.cm.state.selection.main.to
    ).number;
    const changes = [];
    const infoField = props.cm.state.field(editorInfoField, false);
    const file = infoField.file;
    if (file) {
      if (props.plugin.isSpace(file.parent.path)) {
        for (let i = lineStart; i <= lineEnd; i++) {
          const line = props.cm.state.doc.line(i);
          const indentLevel = getMarkdownListIndentLevel(line.text);
          const newText = removeListFormatting(line.text);

          const newFile = await props.plugin.createNote(
            file.parent.path,
            newText
          );
          changes.push({
            from: line.to - newText.length,
            to: line.to,
            insert: `[[${newFile}|${newText}]]`,
          });
        }
        props.cm.dispatch({
          changes: changes,
        });
      }
    }
  };

  const linkText = (e: React.MouseEvent) => {
    props.plugin.selectLink(e, (link) => {
      const currentSelection = props.cm.state.selection.main;
      const selectedText = props.cm.state.sliceDoc(
        currentSelection.from,
        currentSelection.to
      );
      const changes = [
        {
          from: currentSelection.from,
          to: currentSelection.to,
          insert: `[[${link}|${selectedText}]]`,
        },
      ];
      props.cm.dispatch({
        changes: changes,
      });
    });
  };

  const transformText = (collapseMode: number) => {
    const currentLine = props.cm.state.doc.lineAt(
      props.cm.state.selection.main.from
    );
    const higherIndentLines = [];
    let content = null;
    if (collapseMode > 0) {
      const currentLineIndex = props.cm.state.doc.lineAt(
        props.cm.state.selection.main.from
      ).number;
      const indentLevel = getMarkdownListIndentLevel(currentLine.text);

      let i = currentLineIndex + 1;
      while (i <= props.cm.state.doc.lines) {
        const currentLine = props.cm.state.doc.line(i);
        if (getMarkdownListIndentLevel(currentLine.text) > indentLevel) {
          higherIndentLines.push(currentLine);
        }
        if (getMarkdownListIndentLevel(currentLine.text) <= indentLevel) break;
        i++;
      }
      if (collapseMode == 1) {
        content = higherIndentLines
          .map((f) => unindentText(f.text, indentLevel + 1))
          .join("\n");
      }
    }

    const currentLineEnd = props.cm.state.selection.main.to;
    const currentSelection = props.cm.state.selection.main;
    const infoField = props.cm.state.field(editorInfoField, false);
    const file = infoField.file;
    const selectedText = props.cm.state.sliceDoc(
      currentSelection.from,
      currentSelection.to
    );
    if (file) {
      const space = props.plugin.isSpace(file.parent.path);
      if (space) {
        const newPath = sanitizeFileName(selectedText).trim();
        props.plugin
          .createNote(file.parent.path, newPath, content)
          .then((f) => {
            if (f) {
              const changes = [
                {
                  from: currentSelection.from,
                  to: currentSelection.to,
                  insert: `[[${f}|${selectedText}]]`,
                },
              ];
              if (collapseMode == 1) {
                changes.push({
                  from: props.cm.state.doc.lineAt(currentSelection.from + 1).to,
                  to: props.cm.state.doc.line(
                    currentLine.number + higherIndentLines.length
                  ).to,
                  insert: "",
                });
              }
              props.cm.dispatch({
                changes: changes,
              });
            }
          });
      }
    }
  };

  const marksMode = () => (
    <>
      {props.mobile ? (
        <div
          className="mk-mark"
          onMouseDown={() => {
            setMode(0);
          }}
          dangerouslySetInnerHTML={{
            __html: uiIconSet["close"],
          }}
        ></div>
      ) : (
        <></>
      )}
      {resolveStyles().map((s, i) => {
        return (
          <Mark
            plugin={props.plugin}
            key={i}
            i={i}
            style={s}
            active={props.activeMarks.find((f) => f == s.mark) ? true : false}
            toggleMarkAction={toggleMarkAction}
          ></Mark>
        );
      })}
      <div className="mk-divider"></div>
      <div
        aria-label={i18n.styles.blocklink}
        onClick={(e) => {
          linkText(e);
        }}
        className="mk-mark"
        dangerouslySetInnerHTML={{
          __html: uiIconSet["mk-mark-blocklink"],
        }}
      ></div>
      <div className="mk-mark-group">
        <div
          aria-label={"New Note"}
          onMouseDown={() => {
            transformText(0);
          }}
          className="mk-mark"
          dangerouslySetInnerHTML={{
            __html: uiIconSet["new-note"],
          }}
        ></div>
      </div>
      {props.plugin.settings.inlineStylerColors ? (
        <>
          <div className="mk-divider"></div>
          <div
            aria-label={
              !props.plugin.isTouchScreen() ? i18n.styles.textColor : undefined
            }
            onMouseDown={() => {
              setMode(2);
              setColorMode({
                prefix: `<span style='color:`,
                suffix: `'>`,
                closeTag: "</span>",
              });
            }}
            className="mk-mark"
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-mark-color"],
            }}
          ></div>
          <div
            aria-label={
              !props.plugin.isTouchScreen() ? i18n.styles.highlight : undefined
            }
            onMouseDown={() => {
              setMode(2);
              setColorMode({
                prefix: `<mark style='background:`,
                suffix: `'>`,
                closeTag: "</mark>",
              });
            }}
            className="mk-mark"
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-mark-highlight"],
            }}
          ></div>
        </>
      ) : (
        <></>
      )}
    </>
  );

  return (
    <div
      className={classNames(
        props.mobile ? "mk-style-toolbar" : "mk-style-menu"
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      {mode == 0 && props.mobile
        ? makeMode()
        : mode == 2
        ? colorsMode()
        : marksMode()}
    </div>
  );
};
