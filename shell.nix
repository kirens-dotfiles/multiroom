{ pkgs ? import <nixpkgs> {}, nodejs ? pkgs.nodejs-10_x }:

let
  inherit (pkgs)
    stdenv
  ;

in stdenv.mkDerivation {
  name = "node-dev-env";
  buildInputs = [
    nodejs
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}
