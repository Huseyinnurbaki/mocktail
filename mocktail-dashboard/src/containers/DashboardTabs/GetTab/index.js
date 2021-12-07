import React from "react"
import BaseTab from "../../../components/BaseTab";
import TipsNTricks from "../../../components/TipsNTricks";
import Get from "./get";


function GetTab(props) {
  const { tip } = props;
  return (
      <BaseTab>
        <Get {...props} />
        <TipsNTricks tip={tip} />
      </BaseTab>
  )
}

export default GetTab
