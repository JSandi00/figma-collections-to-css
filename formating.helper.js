/**
 * this format the final string to export
 * @param childMode
 * @param varName
 * @param pureObj
 * @returns
 */
export function parceFinalResponse(response, fullVariableName, pureObj, childMode, fullChildVarName) {
    //TODO: manage the export per collection not from a unique variable 
    let parentName = fullVariableName.split('/').pop(); //Choosing the last element of the array, that is the actuall name of the variable;
    if (fullChildVarName) {
        let childName = fullChildVarName.split('/').pop(); //Choosing the last element of the array, that is the actuall name of the variable;
        return response += `$${parentName}: $${childName}; \n`;
    }
    else {
        let hex = rgbToHex(getRgbFromMode(childMode, pureObj));
        return response += `$${parentName}: ${hex};
      `;
    }
}
/**
 * returns child reference mode of a linked variable id
 * @param variableId
 * @returns
 */
export function getVariableMode(variableId) {
    let nestedVariable = figma.variables.getVariableById(variableId);
    let childMode = nestedVariable.valuesByMode; //this (for know) must be rgb @TODO: work in recursive solution
    return JSON.parse(JSON.stringify(childMode));
}
/**
 * Gets the variable name of specofic variable
 * @param variableId
 * @returns
 */
export function getVariableName(variableId) {
    var _a;
    return (_a = figma.variables.getVariableById(variableId)) === null || _a === void 0 ? void 0 : _a.name;
}
//WIP for recursive implementation *******
export function verifyType(modeObj) {
    if (Object.prototype.hasOwnProperty.call(modeObj, 'type')) {
        console.log('verifyng...');
    }
    else {
    }
}
/**
 * this convert the mode values rgb in hex
 * @param modeObj
 * @param pureObj indicates if the object is object or array object TODO: work in better solution for automatic detection for this
 * @returns
 */
export function getRgbFromMode(modeObj, pureObj) {
    let parsedMode = JSON.parse(JSON.stringify(modeObj));
    let r = 0.02;
    let g = 0.02;
    let b = 0.02;
    if (!pureObj) {
        for (const key in parsedMode) {
            let rgb = parsedMode[key];
            r = rgb['r'];
            g = rgb['g'];
            b = rgb['b'];
        }
    }
    else {
        r = parsedMode['r'];
        g = parsedMode['g'];
        b = parsedMode['b'];
    }
    return { r, g, b };
}
//const hex = rgbToHex({ r, g, b });
export function rgbToHex({ r, g, b }) {
    const toHex = (value) => {
        const hex = Math.round(value * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    const hex = [toHex(r), toHex(g), toHex(b)].join("");
    return `#${hex}`;
}
