import React from "react";
import { Image, Modal, Pressable, ScrollView, StatusBar, View } from "react-native";
// import { HEIGHT, MyStatusBar } from "../constants/config";
// import { EMI_LOADER } from "../constants/imagepath";
import { LOADER } from "../../constant/imagePath";
import { MyStatusBar } from "./MyStatusBar";
import { WHITE } from "../../constant/color";
import FastImage from "react-native-fast-image";
export const MyLoader = ({
    visible = false,
    onBackPress,
    imageStyle,
    source,
    backgroundColor = `rgba(100, 100, 100, 0.5)`,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            // animationType='slide'
            statusBarTranslucent
            onRequestClose={() => onBackPress != undefined && onBackPress(false)}
        >
            <Pressable
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: backgroundColor,
                    alignItems: 'center'
                }}>
                <StatusBar backgroundColor={WHITE} barStyle={'dark-content'} />
                <FastImage
                    style={{
                        height: 150,
                        width: 150
                    }}
                    source={LOADER}
                />
            </Pressable>
        </Modal>
    )
}