import { useState, useContext } from "react";
import { BurritoSelect } from "./BurritoSelect";
import { Box } from "@mui/material";
import { getFirstChapter } from "./findFirstChapter";
import ObsNavigation from "./ObsNavigation";
export function WrapperNav({ flavor, obs, setObs }) {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "row", gap: 1, paddingBottom: 5 }}
    >
      <BurritoSelect flavor={flavor} />
      <ObsNavigation obs={obs} setObs={setObs} />
    </Box>
  );
}
