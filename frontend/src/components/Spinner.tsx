import React, { FC } from "react";

const Spinner: FC<{ classNames?: string }> = ({ classNames }) => (
  <span className={"loading loading-spinner" + classNames} />
);

export default Spinner;
