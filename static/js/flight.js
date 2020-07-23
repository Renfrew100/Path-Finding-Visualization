/**
 * ---------------------------------------
 * This demo was created using amCharts 4.
 * 
 * For more information visit:
 * https://www.amcharts.com/
 * 
 * Documentation is available at:
 * https://www.amcharts.com/docs/v4/
 * ---------------------------------------
 */
// Classes for AStar
class GraphNode { 
    constructor(title, parentName, absDistanceFrom, heuristic){ 
        this.title = title;
        this.parent = parentName;
        this.visited = false;
        this.heapInd = -1;
        this.distance = absDistanceFrom;
        this.heuristic = heuristic;
        this.priority = absDistanceFrom + heuristic;
    }
    visit() {
        this.visited = true;
    }
    update(newDistance){
        this.priority = newDistance + heuristic; 
    }
}

class PriorityQueue {
    constructor(){
        this.minheap =[]; 
    }    

    left(ind){
        return 2 * ind+1;
    }

    right(ind) {
        return 2*ind +2;
    }

    parent(ind){
        var floor = Math.floor((ind-1)/2);
        return floor < 0 ? 0 : floor;
    }

    add(node){
        this.minheap.push(node);
        this.minheap[this.minheap.length-1].heapInd = this.minheap.length-1;
        this.bubbleUp();
    }

    updateNode(index, dist, parent){
        // if (dist >= this.minheap[index].distance) return;
        this.minheap[index].priority = dist + this.minheap[index].heuristic;
        this.minheap[index].distance = dist;
        this.minheap[index].parent = parent
        this.bubbleUp(index);
    }

    bubbleUp(index) {
        if (index == null) 
            index = this.minheap.length-1;
        while(index > 0){
            let node = this.minheap[index];
            let parentIndex = this.parent(index);
            let parentNode = this.minheap[parentIndex];

            if (parentNode.priority <= node.priority) break;
            this.minheap[index] = parentNode;
            this.minheap[parentIndex] = node;
            
            // sort out heap indecies
            this.minheap[index].heapInd = index;
            this.minheap[parentIndex].heapInd = parentIndex;
            index = parentIndex;
        }
    }

    pop(){
        return this.poll();
    }

    poll(){
        if (this.minheap.length <= 1 ) return this.minheap.pop();
        const min = this.minheap[0];
        this.minheap[0] = this.minheap.pop();
        // reassign heapInd 
        this.minheap[0].heapInd =0; 

        var i =0; 
        while(true){
            if (this.left(i)< this.minheap.length) {
                if (this.right(i) < this.minheap.length){
                    const lowest  = this.minheap[this.left(i)].priority >=  this.minheap[this.right(i)].priority ? this.right(i) : this.left(i);
                    if (this.minheap[i].priority <= this.minheap[lowest].priority) break;
                    const temp = this.minheap[i];
                    this.minheap[i] = this.minheap[lowest];
                    this.minheap[lowest] = temp;
                    
                    // heap Inds
                    this.minheap[i].heapInd = i;
                    this.minheap[lowest].heapInd = lowest; 
                    i = lowest; 
                } else {
                    if (this.minheap[this.left(i)].priority < this.minheap[i].priority){
                        const temp = this.minheap[i];
                        this.minheap[i] = this.minheap[this.left(i)];
                        this.minheap[this.left(i)] = temp; 

                        // heap Inds
                        this.minheap[i].heapInd = i;
                        this.minheap[this.left(i)].heapInd = this.left(i)
                    }
                    // end of array anyways
                    break;
                 }
            } else {
                break;
            }
        }
        return min;
    }
    
    isEmpty(){
        return this.minheap.length == 0 ? true : false;
    }

    peek (){
        return this.minheap[0];
    }

    searchNode(nodeName){
        for(var i =0; i<this.minheap.length; i++){
            if (this.minheap[i].title == nodeName){
                return this.minheap[i];
            }
       }        
       return -1;
    }
}


//   API calls / page initiation scripts
async function start() {
    var result = {};

    try {
        result = await $.ajax({
            url: "/getFlightData"
        });
    } catch (error) {
        console.error(error);
    }
    
    go(result) 
}
start()


function go(data){
    console.log(data);

    // HAVERSINE FORMULA  / great circlet distance
    function haversineDist (coords1, coords2){
        const R = 6371e3; // radius of the earth in metres 
        const φ1 = coords1.latitude * Math.PI/180; // φ, λ in radians
        const φ2 = coords2.latitude * Math.PI/180;
        const Δφ = (coords2.latitude - coords1.latitude) * Math.PI/180;
        const Δλ = (coords2.longitude-coords1.longitude) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        const distance = R * c; // in metres1   
        return distance;
    }

    function lexigraphicStr (str1, str2){
        var sum =0; 
        for (var i =0; i<str1.length; i++){
            sum += str1.charCodeAt(i);
        }
        for (var i =0; i<str2.length; i++){
            sum -= str2.charCodeAt(i);
        }
        return sum >0 ?  str2 +',' + str1 : str1 + ',' +str2;
    }  

    function aStar(from, to){       // to and from are strings ex. "YYZ", "LAX"

        const iterationLimit = 100000;
        var iteration = 0;
        var pq = new PriorityQueue();

        let gn = new GraphNode(from, null, 0, 0);
        var heuristicCoords = {};
        var nodeMap = {};
        gn.visit();
        nodeMap[from] = gn;
        pq.add(gn);
        while (!pq.isEmpty() && iteration < iterationLimit){
            var top = pq.poll();
            top.visit();
            console.log(top);
            // console.log(pq);
            for (var i =0; i<data['routes'][top.title].length; i++){
                let neighbor = data['routes'][top.title][i];
                var inNodeMap = false;

                if (neighbor in nodeMap){
                    if (nodeMap[neighbor].visited){
                        continue;
                    }
                    inNodeMap = true;
                }
                
                if (neighbor != to){
                    let distanceTo = haversineDist(data.airports[top.title].coords, data.airports[neighbor].coords); 
                    let totalD = distanceTo + top.distance;
                    if (inNodeMap){
                        let ind = nodeMap[neighbor].heapInd;
                        // only update if less than
                        if (totalD < nodeMap[neighbor].distance){
                            pq.updateNode(ind, totalD, top.title);
                        }
                    } else {
                        const str = lexigraphicStr(neighbor, to);
                        let heuristic = 0;
                        if (str in heuristicCoords){
                            heuristic = heuristicCoords[str];
                        } else {
                            heuristic = haversineDist(data['airports'][neighbor].coords, data['airports'][to].coords);
                            heuristicCoords[str] = heuristic;
                        }
                        let gn = new GraphNode(neighbor, top.title, totalD, heuristic);
                        nodeMap[neighbor] = gn;
                        pq.add(gn);
                        console.log( neighbor + " distance to:  " + (totalD + heuristic) + "     =>" + heuristic) 
                    }
                } else {
                    
                    let distanceTo = haversineDist(data['airports'][top.title].coords, data['airports'][neighbor].coords);
                    let totalD = distanceTo + top.distance;
                    var path =[]; 
                    
                    path.push(to);
                    let node = top;
                    while (node != null){
                        path.push(node.title);
                        node = nodeMap[node.parent];
                    }

                    return {'path' : path, 'distance' : totalD};
                }
            }
            iteration++;
        }
        return 'path not found';
    }
    console.log(aStar('AER', 'YYZ'));

    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end
    ``
    // Create map instance
    var chart = am4core.create("chartdiv", am4maps.MapChart);
    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Miller();
    chart.homeZoomLevel = 2.5;
    chart.homeGeoPoint = {
        latitude: 38,
        longitude: -60
    };  


    //  INITAL VARIABLES
    var colors = [];  
    var DIVISOR = 100;

    fillColorsArray(); // fills colors


    // Create map polygon series
    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.useGeodata = true;
    polygonSeries.mapPolygons.template.fill = chart.colors.getIndex(0).lighten(0.5);
    polygonSeries.mapPolygons.template.nonScalingStroke = true;
    polygonSeries.exclude = ["AQ"]; // exculde antartica

    // Add line bullets
    var cities = chart.series.push(new am4maps.MapImageSeries());
    cities.mapImages.template.nonScaling = true;

    var city = cities.mapImages.template.createChild(am4core.Circle);
    city.radius = 3;
    city.fill = chart.colors.getIndex(0).brighten(-0.2);
    // city.fill = "rgb(144,12,63)"
    city.strokeWidth = 1;
    city.stroke = am4core.color("#fff");

    var startAirport = "";
    var endAirport = ""; 

    function setStartAndEnd(start, end){
        startAirport = start;
        endAirport = end; 
    }

    setStartAndEnd("Toronto", 'Los Angeles');

    var cityObjects = {};
    var sizes = {};
    function setSizes(start, end){  
        sizes = {'start': start, 'end' : end}
    }
    function addCity(coords, title, iteration) {
        const rad = city.radius
        setSizes(3, 6)
        const fill = city.fill;
        if ( title === startAirport){
            // add first animation 
            city.radius= 10.5;
            city.fill = "#fff"
        } else if (iteration != -1){
            // city.radius = 6 + (10.5 -6)/DIVISOR * iteration; 
            city.radius = sizes['start'] + (sizes['end'] - sizes['start'])/DIVISOR * iteration;
            city.strokeWidth = city.radius /3
            city.fill = colors[iteration];
        }
        var newcity = cities.mapImages.create();  
        newcity.latitude = coords.latitude;
        newcity.longitude = coords.longitude;
        newcity.tooltipText = title;

        city.radius = rad;
        city.fill = fill;
        
        cityObjects[title] = newcity;
        return newcity;
    }



    // Add Cities
    addCity(data['airports']['AER'].coords, "AER", -1);
    addCity(data['airports']['LED'].coords, "LED", -1);
    addCity(data['airports']['DYU'].coords, "DYU", -1);
    addCity(data['airports']['KIV'].coords, "KIV", -1);
    addCity(data['airports']['MSQ'].coords, "MSQ", -1);
    addCity(data['airports']['TAS'].coords, "TAS", -1);
    addCity(data['airports']['TZX'].coords, "TZX", -1);
    addCity(data['airports']['EVN'].coords, "EVN", -1);
    addCity(data['airports']['KRR'].coords, "KRR", -1);
    addCity(data['airports']['DME'].coords, "DME", -1);
    addCity(data['airports']['OMS'].coords, "OMS", -1);
    addCity(data['airports']['SVO'].coords, "SVO", -1);
    addCity(data['airports']['SVX'].coords, "SVX", -1);
    addCity(data['airports']['LBD'].coords, "LBD", -1);
    addCity(data['airports']['VKO'].coords, "VKO", -1);
    addCity(data['airports']['VNO'].coords, "VNO", -1);
    addCity(data['airports']['RYG'].coords, "RYG", -1);
    addCity(data['airports']['KEF'].coords, "KEF", -1);
    addCity(data['airports']['OSL'].coords, "OSL", -1);



    // var paris = addCity({ "latitude": 48.8567, "longitude": 12.3 }, "Paris", -1);
    // var berlin = addCity({ "latitude": 48.8567, "longitude": 2.3510 }, "Berlin", -1);
    var toronto = addCity({ "latitude": 43.8163, "longitude": -79.4287 }, "Toronto", -1);
    var newYork = addCity({ "latitude": 40.712776, "longitude": -74.005974 }, "New York", -1);
    // var la = addCity({ "latitude": 34.3, "longitude"    : -118.15 }, "Los Angeles", -1);
    // var havana = addCity({ "latitude": 23, "longitude": -82 }, "Havana", -1);    
    

    // // Add lines
    var lineSeries = chart.series.push(new am4maps.MapArcSeries());
    lineSeries.mapLines.template.line.strokeWidth = 2
    lineSeries.mapLines.template.line.strokeOpacity = 0.5;
    lineSeries.mapLines.template.line.stroke = city.fill;
    lineSeries.mapLines.template.line.nonScalingStroke = true;
    lineSeries.mapLines.template.line.strokeDasharray = "1,1";
    lineSeries.zIndex = 10;

    var shadowLineSeries = chart.series.push(new am4maps.MapLineSeries());
    shadowLineSeries.mapLines.template.line.strokeOpacity = 0;
    shadowLineSeries.mapLines.template.line.nonScalingStroke = true;
    shadowLineSeries.mapLines.template.shortestDistance = false;
    shadowLineSeries.zIndex = 5;

    function addLine(from, to) {
        var line = lineSeries.mapLines.create(); 
        line.imagesToConnect = [from, to];
        line.line.controlPointDistance = -0.3;
        var shadowLine = shadowLineSeries.mapLines.create();
        shadowLine.imagesToConnect = [from, to];

        return line;
    }

    // Add lines
    addLine(toronto, newYork);
    // addLine(cityObjects['YCG'], cityObjects['YBC'])
    // addLine(paris, berlin);
    // addLine(paris, toronto);
    // addLine( toronto, paris);
    // addLine(paris, toronto);
    // addLine(toronto, la);
    // addLine(la, havana);
    // addLine(havana, toronto);

    // var queue = new PriorityQueue({ comparator: function(a, b) { return b - a; }});
    function animateCity(title){ 
        var i =0; 
        timeout();
        function timeout() {
            setTimeout(function () {
                if (i != DIVISOR-1){
                    addCity(data.airports[title].coords, title, i);
                    timeout();
                }
                i++;
            }, 25);
        }
    }

    // // PLANE AND SHADOW PLANE CONFIG ###############
    // var plane = lineSeries.mapLines.getIndex(0).lineObjects.create();
    // plane.position = 0;
    // plane.width = 48;
    // plane.height = 48;

    // plane.adapter.add("scale", function(scale, target) {
    //     return 0.5 * (1 - (Math.abs(0.5 - target.position)));
    // })

    // var shadowPlane = shadowLineSeries.mapLines.getIndex(0).lineObjects.create();
    // shadowPlane.position = 0;
    // shadowPlane.width = 48;
    // shadowPlane.height = 48;

    // shadowPlane.adapter.add("scale", function(scale, target) {
    //     target.opacity = (0.6 - (Math.abs(0.5 - target.position)));
    //     return 0.5 - 0.3 * (1 - (Math.abs(0.5 - target.position)));
    // })
    // // ##############################


    // Add Plane to stack
    function addPlane(){

        // PLANE AND SHADOW PLANE CONFIG ###############
        var plane = lineSeries.mapLines.getIndex(0).lineObjects.create();
        plane.position = 0;
        plane.width = 48;
        plane.height = 48;

        plane.adapter.add("scale", function(scale, target) {
            return 0.5 * (1 - (Math.abs(0.5 - target.position)));
        })

        var shadowPlane = shadowLineSeries.mapLines.getIndex(0).lineObjects.create();
        shadowPlane.position = 0;
        shadowPlane.width = 48;
        shadowPlane.height = 48;

        shadowPlane.adapter.add("scale", function(scale, target) {
            target.opacity = (0.6 - (Math.abs(0.5 - target.position)));
            return 0.5 - 0.3 * (1 - (Math.abs(0.5 - target.position)));
        })
        


        var planeImage = plane.createChild(am4core.Sprite);
        planeImage.scale = 0.08;
        planeImage.horizontalCenter = "middle";
        planeImage.verticalCenter = "middle";
        planeImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
        planeImage.fill = chart.colors.getIndex(2).brighten(-0.2);
        planeImage.strokeOpacity = 0;

        var shadowPlaneImage = shadowPlane.createChild(am4core.Sprite);
        shadowPlaneImage.scale = 0.05;
        shadowPlaneImage.horizontalCenter = "middle";
        shadowPlaneImage.verticalCenter = "middle";
        shadowPlaneImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
        shadowPlaneImage.fill = am4core.color("#red");
        shadowPlaneImage.strokeOpacity = 0;

        return {'plane' : plane,'shadowPlane' : shadowPlane, 'planeImage' : planeImage, 'shadowPlaneImage': shadowPlaneImage};
    }   

    // ####################
    // var planeImage = plane.createChild(am4core.Sprite);
    // planeImage.scale = 0.08;
    // planeImage.horizontalCenter = "middle";
    // planeImage.verticalCenter = "middle";
    // planeImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
    // planeImage.fill = chart.colors.getIndex(2).brighten(-0.2);
    // planeImage.strokeOpacity = 0;

    // var shadowPlaneImage = shadowPlane.createChild(am4core.Sprite);
    // shadowPlaneImage.scale = 0.05;
    // shadowPlaneImage.horizontalCenter = "middle";
    // shadowPlaneImage.verticalCenter = "middle";
    // shadowPlaneImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
    // shadowPlaneImage.fill = am4core.color("#red");
    // shadowPlaneImage.strokeOpacity = 0;


    // var planes = [];
    // var planeIndex =0; 
    // var paths = [];
    // // addPlane();

    // // Plane animation
    // var currentLine = 0;
    // var direction = 1;
    // ####################


    function fly(to, from){ 

        // Add lines and path
        var lineSeries = chart.series.push(new am4maps.MapArcSeries());
        lineSeries.mapLines.template.line.strokeWidth = 2
        lineSeries.mapLines.template.line.strokeOpacity = 0.5;
        lineSeries.mapLines.template.line.stroke = city.fill;
        lineSeries.mapLines.template.line.nonScalingStroke = true;
        lineSeries.mapLines.template.line.strokeDasharray = "1,1";
        lineSeries.zIndex = 10;

        var shadowLineSeries = chart.series.push(new am4maps.MapLineSeries());
        shadowLineSeries.mapLines.template.line.strokeOpacity = 0;
        shadowLineSeries.mapLines.template.line.nonScalingStroke = true;
        shadowLineSeries.mapLines.template.shortestDistance = false;
        shadowLineSeries.zIndex = 5;

        var line = lineSeries.mapLines.create(); 
        line.imagesToConnect = [to, from];
        line.line.controlPointDistance = -0.3;

        var shadowLine = shadowLineSeries.mapLines.create();
        shadowLine.imagesToConnect = [to, from];

        



        // PLANE AND SHADOW PLANE CONFIG ###############
        var plane = lineSeries.mapLines.getIndex(0).lineObjects.create();
        plane.position = 0;
        plane.width = 48;
        plane.height = 48;

        plane.adapter.add("scale", function(scale, target) {
            return 0.5 * (1 - (Math.abs(0.5 - target.position)));
        })

        var shadowPlane = shadowLineSeries.mapLines.getIndex(0).lineObjects.create();
        shadowPlane.position = 0;
        shadowPlane.width = 48;
        shadowPlane.height = 48;

        shadowPlane.adapter.add("scale", function(scale, target) {
            target.opacity = (0.6 - (Math.abs(0.5 - target.position)));
            return 0.5 - 0.3 * (1 - (Math.abs(0.5 - target.position)));
        })
        


        var planeImage = plane.createChild(am4core.Sprite);
        planeImage.scale = 0.08;
        planeImage.horizontalCenter = "middle";
        planeImage.verticalCenter = "middle";
        planeImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
        planeImage.fill = chart.colors.getIndex(2).brighten(-0.2);
        planeImage.strokeOpacity = 0;

        var shadowPlaneImage = shadowPlane.createChild(am4core.Sprite);
        shadowPlaneImage.scale = 0.05;
        shadowPlaneImage.horizontalCenter = "middle";
        shadowPlaneImage.verticalCenter = "middle";
        shadowPlaneImage.path = "m2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47";
        shadowPlaneImage.fill = am4core.color("#red");
        shadowPlaneImage.strokeOpacity = 0;

        // const obj = {'plane' : plane,'shadowPlane' : shadowPlane, 'planeImage' : planeImage, 'shadowPlaneImage': shadowPlaneImage};
        plane.mapLine = lineSeries.mapLines.getIndex(0);
        plane.parent = lineSeries;

        shadowPlane.mapLine = shadowLineSeries.mapLines.getIndex(0);
        shadowPlane.parent = shadowLineSeries
        shadowPlaneImage.rotation = planeImage.rotation;

    var animation = plane.animate({
            from: 0,
            to: 1, 
            property: "position"
        }, 5000, am4core.ease.sinInOut);
        animation.events.on("animationended", fly)

        shadowPlane.animate({
            from: 0,
            to: 1,
            property: "position"
        }, 5000, am4core.ease.sinInOut);
        setTimeout(function () {
            // fly(la, paris);
        }, 5000);    
    }

    function flyPlane() {
        // Get current line to attach plane to
        plane.mapLine = lineSeries.mapLines.getIndex(currentLine);
        plane.parent = lineSeries;

        shadowPlane.mapLine = shadowLineSeries.mapLines.getIndex(currentLine);
        shadowPlane.parent = shadowLineSeries;
        shadowPlaneImage.rotation = planeImage.rotation;

        console.log(plane.mapLine);
        // Set up animation
        var from, to;
        var numLines = lineSeries.mapLines.length;
        if (direction == 1) {
            from = 0
            to = 1;
            if (planeImage.rotation != 0) {
                planeImage.animate({ to: 0, property: "rotation" }, 1000).events.on("animationended", flyPlane);
                return;
            }
        }
        else {
            from = 1;
            to = 0;
            if (planeImage.rotation != 180) {
                planeImage.animate({ to: 180, property: "rotation" }, 1000).events.on("animationended", flyPlane);
                return;
            }
        }

        // Start the animation
        var animation = plane.animate({
            from: from,
            to: to,
            property: "position"
        }, 5000, am4core.ease.sinInOut);
        animation.events.on("animationended", flyPlane)
        /*animation.events.on("animationprogress", function(ev) {
        var progress = Math.abs(ev.progress - 0.5);
        //planeImage.scale += 0.2;
        });*/

        shadowPlane.animate({
            from: from,
            to: to,
            property: "position"
        }, 5000, am4core.ease.sinInOut);

        // Increment line, or reverse the direction
        
    //   Deal with changing path

        currentLine += direction;
        if (currentLine < 0) {
            currentLine = 0;
            direction = 1;
        }
    
        //  // reverse direction    
        // else if ((currentLine + 1) > numLines) {
        //     currentLine = numLines - 1;
        //     direction = -1;
        // }
    }



    // fly(toronto, paris)
    // fly(toronto, la)


    // Go!
    // flyPlane();
    // fly();



    function colorAnimation(initObj, targObj, currObj){
        var gradientr = (targObj.r-initObj.r)/DIVISOR ;
        var gradientg = (targObj.g-initObj.g)/DIVISOR ;
        var gradientb = (targObj.b-initObj.b)/DIVISOR ;   
        let objCopy = {'r': currObj.r, 'g' : currObj.g, 'b': currObj.b};
        

        if (gradientr >0){
            if (objCopy.r < targObj.r ) objCopy.r += gradientr;
        } else if (gradientr <0 ){
            if (objCopy.r > targObj.r) objCopy.r += gradientr
        }
        if (gradientg >0){
            if (objCopy.g < targObj.g ) objCopy.g += gradientg;
        } else if (gradientg <0 ){
            if (objCopy.g > targObj.g) objCopy.g += gradientg;
        }
        if (gradientb >0){
            if (objCopy.b <  targObj.b ) objCopy.b += gradientb;
        } else if (gradientb <0 ){
            if (objCopy.b > targObj.b) objCopy.b += gradientb
        }

        var data = {};
        var newString = "rgb(" + Math.round(objCopy.r).toString(10) + "," +   Math.round(objCopy.g).toString(10) + "," + Math.round(objCopy.b).toString(10) +  ")"; 

        data['string'] = newString;
        data['object'] = objCopy;
        return data;
    }

    function fillColorsArray(){
        const startCol = {'r' : 64, 'g': 155, 'b' : 208};
        const currCol = {'r' : 64, 'g': 155, 'b' : 208};
        const targCol = {'r' : 144, 'g': 12, 'b' : 63};
        // const targCol = {'r' : 59, 'g': 139, 'b' : 176};

        var col = colorAnimation(startCol, targCol, currCol); 
        for (var i =1; i<DIVISOR ; i++ ){
            col = colorAnimation(startCol, targCol, col.object);
            colors[i] = col.string;
        }
    }

    // animateCity("YYZ");
    // animateCity('Paris');
    // animateCity('Havana');
}