import { useEffect, useState, useContext } from "react";
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
import { getText } from "pankosmia-lib/http";

function OBSArticlesViewerMuncher({ metadata, debugRef, obs }) {
  const [ingredient, setIngredient] = useState([]);
  const [verseNotes, setVerseNotes] = useState([]);

  const getAllData = async () => {
    const ingredientLink = `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=OBS.tsv`;
    let response = await getText(ingredientLink, debugRef.current);
    if (response.ok) {
      setIngredient(
        response.text
          .split("\n")
          .map((l) => l.split("\t").map((f) => f.replace(/\\n/g, "\n\n"))),
      );
    } else {
      setIngredient([]);
    }
  };

  useEffect(() => {
    getAllData().then();
  }, [obs]);

  useEffect(() => {
    const doVerseNotes = async () => {
      let ret = [];
      for (const row of ingredient.filter(
        (l) => l[0] === `${obs[0]}:${obs[1]}`,
      )) {
        let payloadLink = row[5];
        // console.log('payloadLink', payloadLink);
        let payloadResponse = await getText(
          `/api/burrito/ingredient/raw/${metadata.local_path}?ipath=${payloadLink.slice(2)}.md`,
        );
        // console.log('payloadResponse', payloadResponse);
        if (payloadResponse.ok) {
          ret.push(payloadResponse.text);
        }
      }
      setVerseNotes(ret);
    };
    doVerseNotes().then();
  }, [ingredient]);

  const articleLabel = `(${obs[0]}:${obs[1]})`;

  return (
    <Box sx={{ flexGrow: 1 }}>
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
            title={articleLabel}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {articleLabel}
          </Typography>
        </Grid>
        <Grid item size={12}>
          {verseNotes.length > 0 &&
            [...new Set(verseNotes)].map((v, n) => {
              return (
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id={`tword-${n}`}
                  >
                    <Typography component="span">
                      {v.split("##")[0].slice(2)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {ingredient && (
                      <Markdown className="markdown">{v}</Markdown>
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

export default OBSArticlesViewerMuncher;
