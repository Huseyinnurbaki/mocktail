import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import TipsNTricks from '../../../components/TipsNTricks';
import GenerateTab from './generateTab';

function Generate(props) {
  const { tip } = props;
  return (
    <BaseTab>
      <GenerateTab {...props} />
      <TipsNTricks tip={tip} />
    </BaseTab>
  );
}

export default Generate;

Generate.propTypes = {
  tip: PropTypes.string
};
