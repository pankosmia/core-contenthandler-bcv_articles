import { useEffect, useState, useContext, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Markdown from "react-markdown";
import { getText, getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";

import TextDir from "../helpers/TextDir";
import { EnglishStemmer } from "snowball-stemmer.jsx/dest/english-stemmer.common.js";
import { SpanishStemmer } from "snowball-stemmer.jsx/dest/spanish-stemmer.common.js";
import { FrenchStemmer } from "snowball-stemmer.jsx/dest/french-stemmer.common.js";

function BcvArticlesViewerMuncher({
  metadata,
  systemBcv,
  i18nRef,
  debugRef,
  enabledRef,
  word,
}) {
  const [ingredient, setIngredient] = useState([]);
  const [verseNotes, setVerseNotes] = useState([]);
  const [textDir, setTextDir] = useState(
    metadata?.script_direction
      ? metadata.script_direction.toLowerCase()
      : undefined,
  );

  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const sbScriptDir = metadata?.script_direction
    ? metadata.script_direction.toLowerCase()
    : undefined;
  const sbScriptDirSet = sbScriptDir === "ltr" || sbScriptDir === "rtl";

  const [language, setLanguage] = useState("en");

  const stemmers = useMemo(
    () => ({
      en: new EnglishStemmer(),
      eng: new EnglishStemmer(),
      es: new SpanishStemmer(),
      spa: new SpanishStemmer(),
      fr: new FrenchStemmer(),
      fra: new FrenchStemmer(),
    }),
    [],
  );

  const BaseStemmer = useMemo(() => ({ stemWord: (w) => w }), []);

  const stemmer = stemmers[language] || BaseStemmer;

  const getAllData = async () => {
    const ingredientLink = `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${systemBcv.bookCode}.tsv`;
    const metadataLink = `/api/burrito/metadata/summary/${metadata.local_path}`;
    let response = await getText(ingredientLink, debugRef.current);
    let metadataResponse = await getJson(metadataLink, debugRef.current);
    if (response.ok) {
      setIngredient(
        response.text
          .split("\n")
          .map((l) => l.split("\t").map((f) => f.replace(/\\n/g, "\n\n"))),
      );
    } else {
      setIngredient([]);
    }
    if (metadataResponse.ok) {
      setLanguage(metadataResponse.json.language_code);
    }
  };

  useEffect(
    () => {
      getAllData().then();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [systemBcv],
  );

  useEffect(
    () => {
      const doVerseNotes = async () => {
        let ret = [];
        const seenLinks = new Set();
        const startVerse = systemBcv.verseNum;
        const endVerse = systemBcv.endVerseNum || systemBcv.verseNum;

        const filteredRows = ingredient.filter((row) => {
          const reference = row[0];
          if (!reference) return false;
          const [chapterPart, versePart] = reference.split(":");
          const chapter = parseInt(chapterPart);
          if (chapter !== systemBcv.chapterNum) return false;

          let rowStart, rowEnd;
          if (versePart.includes("-")) {
            const [start, end] = versePart.split("-").map(Number);
            rowStart = start;
            rowEnd = end;
          } else {
            rowStart = rowEnd = parseInt(versePart);
          }

          return rowStart <= endVerse && rowEnd >= startVerse;
        });

        for (const row of filteredRows) {
          let payloadLink = row[5];
          const tWordPath = payloadLink.slice(2);
          const ipath = tWordPath.includes(".md")
            ? tWordPath
            : `${tWordPath}.md`;
          if (seenLinks.has(payloadLink)) continue;
          seenLinks.add(payloadLink);
          let payloadResponse = await getText(
            `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${ipath}`,
          );
          if (payloadResponse.ok) {
            ret.push(payloadResponse.text);
          }
        }
        setVerseNotes(ret);
        if (!sbScriptDirSet) {
          const dir = await TextDir(ret.toString(), "md");
          setTextDir(dir);
        }
      };
      doVerseNotes().then();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ingredient,
      systemBcv.chapterNum,
      systemBcv.verseNum,
      systemBcv.endVerseNum,
    ],
  );

  useEffect(() => {
    if (word?.target) {
      const matchIndex = verseNotes.findIndex((v) => {
        const titleWords = v
          .split("\n")[0]
          .slice(2)
          .split(",")
          .map((w) => stemmer.stemWord(w.trim().toLowerCase()));
        const target = stemmer.stemWord(word.target.toLowerCase());
        return titleWords.some((w) => w === target);
      });
      setExpandedAccordion(matchIndex >= 0 ? matchIndex : null);
    }
  }, [word, verseNotes, stemmer]);

  const verseLabel = `(${systemBcv.bookCode} ${systemBcv.chapterNum}:${systemBcv.verseNum}${systemBcv.endVerseNum && systemBcv.endVerseNum !== systemBcv.verseNum ? `-${systemBcv.endVerseNum}` : ""})`;

  // If SB does not specify direction then it is set here, otherwise it has already been set per SB in WorkspaceCard
  return (
    <Box sx={{ flexGrow: 1 }} dir={!sbScriptDirSet ? textDir : undefined}>
      <Grid
        container
        direction="row"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Grid
          item
          size={3}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle1"
            title={verseLabel}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {verseLabel}
          </Typography>
        </Grid>
        <Grid item size={12}>
          {verseNotes.length > 0 &&
            [...new Set(verseNotes)].map((v, n) => {
              return (
                <Accordion
                  expanded={expandedAccordion === n}
                  onChange={() =>
                    setExpandedAccordion(expandedAccordion === n ? null : n)
                  }
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id={`tword-${n}`}
                  >
                    <Typography component="span" sx={{ fontWeight: "bold" }}>
                      {v.split("\n")[0].slice(2)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {ingredient && (
                      <div className="markdown">
                        <Markdown>
                          {enabledRef.current
                            ? v
                            : v.replace(
                                /\[([^\]]+)\]\([^\)]+\)/g,
                                (match, p1) =>
                                  `${p1} ${doI18n("pages:core-local-workspace:link_disabled_offline", i18nRef.current)}`,
                              )}
                        </Markdown>
                      </div>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
        </Grid>
      </Grid>
    </Box>
  );
}

export default BcvArticlesViewerMuncher;
