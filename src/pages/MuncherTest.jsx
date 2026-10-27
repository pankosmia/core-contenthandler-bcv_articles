import { Box } from "@mui/material";
import {
  currentProjectContext,
  bcvContext,
  debugContext,
  i18nContext,
  wordContext,
  netContext,
  Header,
} from "pankosmia-rcl";
import { useContext, useState, useEffect } from "react";
import { getJson } from "pankosmia-lib/http";
import { WrapperNav } from "../components/bcvArticlesMuncher/wrapperMuncher/WrapperNav";
import { Padding } from "@mui/icons-material";
import BcvArticlesViewerMuncher from "../components/bcvArticlesMuncher/muncher/Viewer/BcvArticlesViewerMuncher";

export function MuncherTest() {
  const { bcvRef } = useContext(bcvContext);
  const { currentProjectRef } = useContext(currentProjectContext);
  const { debugRef } = useContext(debugContext);
  const { i18nRef } = useContext(i18nContext);
  const [currentBurrito, setCurrentBurrito] = useState(null);
  const [modified, setModified] = useState(false);
  const { word } = useContext(wordContext);
  const { enabledRef } = useContext(netContext);
  const { systemBcv } = useContext(bcvContext);
  useEffect(() => {
    async function getSummary() {
      if (currentProjectRef.current) {
        const projectPath = `${currentProjectRef.current.source}/${currentProjectRef.current.organization}/${currentProjectRef.current.project}`;
        const fullMetadataResponse = await getJson(
          `/api/burrito/metadata/summary/${projectPath}`,
        );
        if (fullMetadataResponse.ok) {
          const entry = fullMetadataResponse.json;
          setCurrentBurrito([projectPath, entry]);
        } else {
          enqueueSnackbar(
            `${doI18n("pages:core-contenthandler-bcv_articles:error", i18nRef.current)}: ${fullMetadataResponse.status}`,
            { variant: "error" },
          );
        }
      }
    }

    getSummary();
  }, [currentProjectRef.current]);

  const metadata = currentBurrito && {
    local_path: currentBurrito[0],
    ...currentBurrito[1],
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box>
        <Header
          titleKey={"pages:core-contenthandler-bcv_articles:titleMuncherTest"}
          currentId="content"
          requireNet={false}
        />
      </Box>
      <Box sx={{ paddingLeft: 2, paddingTop: 2, flexShrink: 0 }}>
        <WrapperNav flavor={"x-bcvarticles"} />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {metadata && (
          <Box sx={{ margin: 2 }}>
            <BcvArticlesViewerMuncher
              metadata={metadata}
              debugRef={debugRef}
              i18nRef={i18nRef}
              word={word}
              enabledRef={enabledRef}
              systemBcv={systemBcv}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
