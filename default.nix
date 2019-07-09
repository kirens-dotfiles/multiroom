{ pkgs ? import <nixpkgs> { inherit system; }
, system ? builtins.currentSystem
, nodejs ? pkgs.nodejs-10_x
, multiroomHost
}:

let
  nodeEnv = import ./node-env.nix {
    inherit (pkgs) stdenv python2 utillinux runCommand writeTextFile;
    inherit nodejs;
    libtool = if pkgs.stdenv.isDarwin then pkgs.darwin.cctools else null;
  };
  initial = import ./node-packages.nix {
    inherit (pkgs) fetchurl fetchgit;
    inherit nodeEnv;
    globalBuildInputs = [ pkgs.makeWrapper ];
  };
in initial // {
  package = initial.package.overrideAttrs (_: { postInstall = ''
    # Bind executable with shebang
    echo '#! ${nodejs}/bin/node' \
      | cat - $out/lib/node_modules/multiroom/index.js \
      > $out/index.js
    chmod +x $out/index.js
    mv $out/index.js $out/lib/node_modules/multiroom/index.js

    # Link binary with necessary environment
    mkdir -p $out/bin
    makeWrapper $out/lib/node_modules/multiroom/index.js $out/bin/multiroom \
      --set-default MULTIROOM_HOST ${multiroomHost} \
      --set NODE_PATH=$out/lib/node_modules/rofi-toggl/node_modules
  ''; });
}
