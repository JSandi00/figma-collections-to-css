// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
// import {parceFinalResponse, getVariableMode, getVariableName} from './formating.helper'

console.clear();

type ModeType = {
    type: string,
    id: string
}

type RGBType = {
    r: number,
    g: number,
    b: number,
    a: number
}

//code html conications types
const COLLECTION_RESPONSE = 'COLLECTION_RESPONSE';
const COLLECTION_AVAILABLE = 'COLLECTION_AVAILABLE';

let response = ``;
let sortedVariableNames: Record<string, string> = {}; 

// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many rectangles on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);
  figma.ui.resize(920, 620);


  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    if (msg.type === 'create-scss') {
      sortedVariableNames = {};

      let collection = figma.variables.getVariableCollectionById(msg.selectedCollectionId);
        response = `//Collection: ${collection!.name} with mode: ${msg.selectedModeName}
`;
        let localVariables: Variable[] = [];
        collection!.variableIds.forEach((id: string) => {
          let variable = figma.variables.getVariableById(id.toString());
            localVariables.push(variable!); //exxclamation mark to indicate the variable will nerver be null
        });
        
        localVariables.forEach( (variable) => {
          const modes = JSON.parse(JSON.stringify(variable.valuesByMode)); //object with modeId and id (of linked variable)
          let mode = modes[msg.selectedModeId];
          // Object.keys(modes)[0]; // obtaining just for a single and fisrt mode TODO: work in multiple modes option
          if(mode){
            getVariableValue(mode, 'firstKeyMode', variable.name);
          }
        });
        response += writeFinalResponse();
        figma.ui.postMessage({type: COLLECTION_RESPONSE, response: response, collectionName: collection!.name, selectedMode: msg.selectedModeName});

    }else if (msg.type === 'load-collections'){
      let collections = figma.variables.getLocalVariableCollections();
      collections.forEach((collection) => {
        //this is for show in checkboxes options, the names of specific collection to export
        //note: the program do not let me pass the entire collections object with all properties, just read id propertie 
        figma.ui.postMessage({type: COLLECTION_AVAILABLE, response: {id: collection.id, name: collection.name, modes: collection.modes}});
      });
    }else if (msg.type === 'cancel'){
      figma.closePlugin();
    }
  };

  /**
   * this pretends to get the value of a variable | WIP: get the actual hex per each variable
   * @param mode 
   * @param key 
   * @param originalVariableName 
   * @returns 
   */
  function getVariableValue(mode: any, key: string, originalVariableName: string) {
      // reparsing the object cause type issues in figma lib
      let modeObj = JSON.parse(JSON.stringify(mode));

      // if the obj has 'tyoe' key means that the value of the mode is ference variable
      if(modeObj['type']){
        let childVariableName = getVariableName(modeObj['id']);

        //for future inplementation, this works like an option to replace (only to layers down) if the value of var is another var, with the actual hex
        // findReferenceHex(parsedChildMode, modeObj, originalVariableName);
        sortFinalResponse(originalVariableName, false, null, childVariableName);
      }else {
        sortFinalResponse(originalVariableName, true, modeObj);
      }
  }
} //end if figma

// this is if in the future we need all the variables with their hex value intead of another variable refrence (this for the var that has link variables)
// this work in to layer model TODO: work in recursive solution
function findReferenceHex(parsedChildMode: any, modeObj: any, originalVariableName: string){
    //need way to get the rgb value of this referenced variable
    let firstChildKey = Object.keys(parsedChildMode)[0];
    let firstChildMode = parsedChildMode[firstChildKey];
    
    if(firstChildMode['type']){
      console.log('!!!!!!!!!', firstChildMode);
      let parcedGrandChildMode = getVariableMode(firstChildMode['id']); //this (for know) must be rgb @TODO: work in recursive solution
      console.log('first mode ', parcedGrandChildMode)
      return sortFinalResponse(originalVariableName, false, parcedGrandChildMode);
    } else {
      return sortFinalResponse(originalVariableName, false, parsedChildMode);
    }
}
 

/**
 * this format the final string to export
 * @param childMode 
 * @param varName 
 * @param pureObj 
 * @returns 
 */
function sortFinalResponse(fullVariableName: string, pureObj: boolean, childMode?: any, fullChildVarName?: string) {
    //TODO: manage the export per collection not from a unique variable 
    let parentName = fullVariableName.split('/').pop(); //Choosing the last element of the array, that is the actuall name of the variable;
    let category: string = fullVariableName.split('/')[1] ? fullVariableName.split('/')[1] : fullVariableName.split('/')[0];
    
    if(fullChildVarName){
      let childName = fullChildVarName.split('/').pop(); //Choosing the last element of the array, that is the actuall name of the variable;
      if(sortedVariableNames[category] == undefined){
        sortedVariableNames[category] = '';
      }
      sortedVariableNames[category] += `$${parentName}: $${childName}; \n `;

    }else {
      let hex = rgbToHex(getRgbFromMode(childMode, pureObj));
      if(sortedVariableNames[category] == undefined){
        sortedVariableNames[category] = '';
      }
      sortedVariableNames[category] += `$${parentName}: ${hex}; \n`;
    }
  }

  function writeFinalResponse () {
    let res = ''
    for (const key in sortedVariableNames) {
      res += `\n // ${key} \n ${sortedVariableNames[key]}`
    }
    return res;
  }
  
  /**
   * returns child reference mode of a linked variable id
   * @param variableId 
   * @returns 
   */
  function getVariableMode(variableId: string){
    let nestedVariable = figma.variables.getVariableById(variableId);
    let childMode = nestedVariable!.valuesByMode; //this (for know) must be rgb @TODO: work in recursive solution
    return JSON.parse(JSON.stringify(childMode));
  }
  
  /**
   * Gets the variable name of specofic variable
   * @param variableId 
   * @returns 
   */
  function getVariableName(variableId: string){
    return figma.variables.getVariableById(variableId)?.name;
  }
  
  //WIP for recursive implementation *******
  function verifyType(modeObj: ModeType | RGBType) {
    if(Object.prototype.hasOwnProperty.call(modeObj, 'type')){
      console.log('verifyng...');
    }else {
  
    }
  }
  
  /**
   * this convert the mode values rgb in hex
   * @param modeObj 
   * @param pureObj indicates if the object is object or array object TODO: work in better solution for automatic detection for this
   * @returns 
   */
  function getRgbFromMode(modeObj: RGBType, pureObj: boolean) {
    let parsedMode = JSON.parse(JSON.stringify(modeObj));
    let r = 0.02;
    let g = 0.02;
    let b = 0.02;
  
    if(!pureObj){
      for (const key in parsedMode) {
        let rgb = parsedMode[key];
        r = rgb['r'];
        g = rgb['g'];
        b = rgb['b'];
      }
    }else {
      r = parsedMode['r'];
      g = parsedMode['g'];
      b = parsedMode['b'];
    }
    
    return {r, g, b};
  }
  
  //const hex = rgbToHex({ r, g, b });
  function rgbToHex({ r, g, b }: any) {
    const toHex = (value: any) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
  
    const hex = [toHex(r), toHex(g), toHex(b)].join("");
    return `#${hex}`;
  }

// Runs this code if the plugin is run in FigJam
if (figma.editorType === 'figjam') {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many shapes and connectors on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-shapes') {
      const numberOfShapes = msg.count;
      const nodes: SceneNode[] = [];
      for (let i = 0; i < numberOfShapes; i++) {
        const shape = figma.createShapeWithText();
        // You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.x = i * (shape.width + 200);
        shape.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        figma.currentPage.appendChild(shape);
        nodes.push(shape);
      };

      for (let i = 0; i < (numberOfShapes - 1); i++) {
        const connector = figma.createConnector();
        connector.strokeWeight = 8

        connector.connectorStart = {
          endpointNodeId: nodes[i].id,
          magnet: 'AUTO',
        };

        connector.connectorEnd = {
          endpointNodeId: nodes[i+1].id,
          magnet: 'AUTO',
        };
      };

      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  };
};