import { Node } from "../d3/models";
import nodeConfig from "src/app/config_default.json";
const debug = false;

export class SizeCalculator {

    static setNodeSizes(node: Node) {
        // get the value that is used to dynamically increase the different sizes, it is based on the ougoingLinks or incomingLinks
        // const value = node[node.weightedBy];
        // console.log("SizeCalculator!!!")

        node.fontSize = this.calcFontSize(node, node.sizeWeight);
        node.width = this.calcWidth(node, node.sizeWeight, nodeConfig.nrClippedCharacters, nodeConfig.nodePadding);
        node.height = this.calcHeight(node, node.sizeWeight, nodeConfig.nrClippedCharacters, nodeConfig.nodePadding); // width called before height !
        node.imageSize = this.calcImageSize(node, node.sizeWeight, nodeConfig.node_image_initial_radius);
        node.imageRadius = this.calcImageRadius(node, node.sizeWeight, nodeConfig.node_image_initial_radius);
        node.textY = this.calcTextY(node, node.sizeWeight);
        node.offsetX = this.calcOffsetX(node, node.sizeWeight);
        node.offsetY = this.calcOffsetY(node, node.sizeWeight);
        node.fontWeight = this.calcFontWeight(node, node.sizeWeight);
        node.imageOffsetXY = this.calcImageOffsetXY(node, node.sizeWeight, nodeConfig.node_image_initial_radius);
    }

    /**
     * textsize uses the nodeDummy from index.html to get the dynamic text width and height
     * @param str 
     * @param fontSize 
     */
    static textSize(str: string, fontSize,) {
        var text = document.getElementById("nodeDummy");
        text.style.fontSize = fontSize;
        text.style.width = "auto";
        text.style.height = "auto";
        text.style.visibility = "hidden";
        text.style.position = "absolute";
        text.style.whiteSpace = "nowrap";
        text.innerHTML = str;
        return { width: text.clientWidth, height: text.clientHeight }
    }

    /**
     * computes the width of the node ellipse
     * @param node 
     * @param weight node sizeweight
     * @param nrClippedCharacters how many characters are clipped
     * @param padding nr of pixels left as padding
     */
    static calcWidth(node: Node, weight: number, nrClippedCharacters: number, padding: number) {
        var width = this.textSize(this.getClippedNodeLabel(node.data.mainLabel, nrClippedCharacters), node.fontSize).width;

        return (width) + padding;
    }

    /**
     * computes the height of the node ellipse
     * @param node 
     * @param weight node sizeweight
     * @param nrClippedCharacters how many characters are clipped
     * @param padding nr of pixels left as padding
     */
    static calcHeight(node: Node, weight: number, nrClippedCharacters: number, padding: number) {
        var height = this.textSize(this.getClippedNodeLabel(node.data.mainLabel, nrClippedCharacters), node.fontSize).height;
        return height + padding;
    }

    static calcImageSize(node: Node, value: number, radius: number) {
        return 2 * radius + (Math.log(value + 1) * radius);
    }

    static calcImageRadius(node: Node, value: number, radius: number) {
        return radius + (Math.log(value + 1) * radius / 2);
    }

    static calcImageOffsetXY(node: Node, value: number, radius: number) {
        return -radius - (Math.log(value + 1) * radius / 2);
    }

    static calcTextY(node: Node, value: number) {
        // tslint:disable-next-line: no-string-literal
        const isChromium = window["chrome"];
        const winNav = window.navigator;
        const vendorName = winNav.vendor;

        if (
            isChromium !== null &&
            typeof isChromium !== "undefined" &&
            vendorName === "Google Inc.") {
            return -1.5 + (value / 2);
        } else {
            return 5 + (value);
        }
    }

    static calcOffsetX(node: Node, value: number) {
        return -1 * node.width / 2;
    }

    static calcOffsetY(node: Node, value: number) {
        return -1 * node.height / 2;
    }

    static calcFontSize(node: Node, value: number) {
        return (1 + (0.1 * value)) + "em";
    }

    static calcFontWeight(node: Node, value: number) {
        return 400 + (value * 50);
    }


    static getClippedNodeLabel(str: String, length: number) {
        if (str)
            return str.substring(0, length) + (str.length > length ? "..." : "");
        else
            return ""
    }

    /**
     * 
     * @param list 
     * @param obj 
     */
    static contains(list, obj) {
        let i = list.length;
        while (i--) {
            if (list[i].uri === obj.uri && list[i].label === obj.label && list[i].prettyLabel === obj.prettyLabel) {
                return true;
            }
        }
        return false;
    }
}
