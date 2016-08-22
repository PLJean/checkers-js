function Board() {
    var dark = true;

    for (var r = 0; r < Board.SIZE; r++) {
        for (var c = 0; c < Board.SIZE; c++) {
            var tile, piece;
            if (dark) {
                tile = new Tile(color.DARK, c, r);
            }

            else {
                tile = new Tile(color.LIGHT, c, r);
            }

            if (r < 3 && dark) {
                piece = new Piece(team.BLACK, c, r);
                tile.placePiece(piece);
                Piece.teamBlack.push(piece);
            }

            else if (r > 4 && dark) {
                piece = new Piece(team.RED, c, r);
                tile.placePiece(piece);
                Piece.teamRed.push(piece);
            }

            // this.tiles.push(tile);
            Tile.all.push(tile);
            dark = !dark;
        }
        dark = !dark;
    }
}

Board.SIZE = 8;

Board.prototype.holding = null;

Board.prototype.currentTurn = team.BLACK;

Board.prototype.legalCircles = [];

Board.prototype.tileAt = function(x, y) {
    return Tile.all[x + Board.SIZE * y];
};

Board.prototype.pieceAt = function(x, y) {
    return Tile.all[x + Board.SIZE * y].piece;
};

Board.prototype.grab = function(x, y) {
    if (this.holding == null) {
        this.holding = this.pieceAt(x, y);
        console.log("Holding: (" + x + ", " + y + ")");
    } else {
        console.log("Cannot grab. Currently holding: (" + this.holding + ")" );
    }
};

Board.prototype.drop = function(x, y) {
    if (this.holding != null && this.isLegal(x, y)) {
        var newTile = this.tileAt(x, y);
        var oldCol = this.holding.mesh["col"];
        var oldRow = this.holding.mesh["row"];
        this.holding.mesh["col"] = x;
        this.holding.mesh["row"] = y;
        newTile.placePiece(this.holding);
        this.holding.mesh.position.set(newTile.position.x, newTile.position.y, newTile.position.z);
        this.tileAt(oldCol, oldRow).placePiece(null);
        // console.log("Dropped at: (" + x + ", " + y + ")");

    }

    this.holding = null;

};

Board.prototype.isLegal = function(x, y) {
    // console.log("in isLegal()");
    // console.log(x, + ", " + y);
    if (this.holding == null) return false;
    var col = this.holding.mesh["col"];
    var row = this.holding.mesh["row"];

    if (Math.abs(col - x) != 1 || Math.abs(row - y) != 1)
        return false;

    else if (this.pieceAt(x, y) != null)
        return false;

    else if (this.holding.team == team.BLACK && this.holding.king == false && y < row)
        return false;

    else if (this.holding.team == team.RED && this.holding.king == false && y > row)
        return false;

    return true;
};

Board.prototype.allMoves = function(x, y) {
    var possibleMoves = [[x - 1, y - 1], [x - 1, y + 1], [x + 1, y - 1], [x + 1, y + 1]];
    var moves = [];
    for (var i = 0; i < possibleMoves.length; i++) {
        if(this.isLegal(possibleMoves[i][0], possibleMoves[i][1])) {
            console.log(possibleMoves[i][0], possibleMoves[i][1]);
            moves.push(possibleMoves[i]);
        }
    }

    return moves;
};

Board.prototype.showLegals = function(x, y, scene) {
    var piece = this.pieceAt(x, y);
    console.log("in showLegals()");
    console.log(piece);
    if (piece == null) return;

    var moves = this.allMoves(x, y);
    console.log(moves);
    for (var i = 0; i < moves.length; i++) {
        var geometry = new THREE.CircleGeometry(Tile.SIZE * .40, 32);
        var material = (piece.team == team.BLACK) ? new THREE.LineBasicMaterial({color: 0x000000}) : new THREE.LineBasicMaterial({color: 0xff0000});

        geometry.vertices.shift();
        var circle = new THREE.Line(geometry, material);
        var tile = this.tileAt(moves[i][0], moves[i][1]);
        circle.position.set(tile.position.x, tile.position.y, tile.position.z + 1);
        circle.name = 'legal' + i;
        this.legalCircles.push(circle);
        console.log("circle");
        console.log(circle);
        scene.add(circle);
    }
};

Board.prototype.unshowLegals = function(scene) {
    for (var i = 0; i < this.legalCircles.length; i++) {
        scene.remove(this.legalCircles[i]);
    }
};

Board.prototype.build = function (scene) {
    var startPosition = new THREE.Vector3(-4 * Tile.SIZE + 1/2 * Tile.SIZE, -4 * Tile.SIZE + 1/2 * Tile.SIZE, 0);

    for (var r = 0; r < Board.SIZE; r++) {
        for (var c = 0; c < Board.SIZE; c++) {
            var tileGeometry = new THREE.BoxGeometry(Tile.SIZE, Tile.SIZE, 1);

            var tileMaterial;
            if (this.tileAt(c, r).color == color.DARK)
                tileMaterial = new THREE.MeshBasicMaterial({color: 0x808080, vertexColors: THREE.FaceColors});
            else
                tileMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: THREE.FaceColors});


            var newPosition = new THREE.Vector3(startPosition.x + Tile.SIZE * c, startPosition.y + Tile.SIZE * r, startPosition.z);

            this.tileAt(c, r).make(tileGeometry, tileMaterial, newPosition);
            scene.add(this.tileAt(c, r).mesh);

            var piece = this.tileAt(c, r).piece;
            if (piece != null) {
                var pieceGeometry, pieceMaterial, col, row, piecePosition, i;
                pieceGeometry = new THREE.CylinderGeometry(Tile.SIZE * .40, Tile.SIZE * .40, 1.25, 32);
                pieceGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad( 90 ) ));
                if (piece.team == team.BLACK)
                    pieceMaterial = new THREE.MeshBasicMaterial({color: 0x000000, vertexColors: THREE.FaceColors});
                else
                    pieceMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, vertexColors: THREE.FaceColors});

                piece.setMesh(new THREE.Mesh(pieceGeometry, pieceMaterial));

                piece.mesh["checkersObject"] = 'Piece';
                piece.mesh["col"] = c;
                piece.mesh["row"] = r;
                piecePosition = this.tileAt(c, r).position;
                piece.mesh.position.set(piecePosition.x, piecePosition.y, piecePosition.z);
                scene.add(piece.mesh);
            }

            // console.log(this.tileAt(c, r).position);
            // console.log(newPosition);
        }
    }
};

Board.prototype.anyTilesClicked = function (x, y) {
    for (var r = 0; r < Board.SIZE; r++) {
        for (var c = 0; c < Board.SIZE; c++) {
            if (this.tileAt(c, r).isClicked(x, y)) {
                // console.log("r: " + r + " c: " + c);
            }
        }
    }
};