import React from "react";
import styles from "../../assets/css/profile.module.css";

function TopFive(props) {
  const handleRankingChange = (event, index) => {
    const newRankings = [...props.rankings];
    newRankings[index] = event.target.value;
    props.handleRankingChange(newRankings);
  };

  return (
    <div className={"flex-col w-full pl-5 pr-5"}>
      <p className={"flex-1"}>{props.question}</p>
      <div className={"truncate"}>
        {props.rankings.map((item, index) => (
          props.editing ? (
            <input
              key={index}
              className={"inline-block flex h-[3vh] resize-none border"}
              value={item || ''}
              onChange={(event) => handleRankingChange(event, index)}
            />
          ) : (
            <p key={index} className={"inline-block flex h-[3vh]"}>{index + 1}. {item}</p>
          )
        ))}
      </div>
    </div>
  );
}


export default TopFive;
