import React from "react";
import { StatusBar } from "react-native";
import { WHITE } from "../../constant/color";

export const MyStatusBar = ({
    backgroundColor= {},
    barStyle= ""
}) =>{
    return(
        <>
        {/* Status Bar */}
        <StatusBar backgroundColor={backgroundColor} barStyle={barStyle} />
        </>
    )
}