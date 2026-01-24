{
  inputs = {
    utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        HOST = "http://host.docker.internal:8787";

        pkgs = nixpkgs.legacyPackages.${system};
        mediamtxConfig = pkgs.writeText "mediamtx.yml" ''
          webrtc: yes
          webrtcAddress: :8889
          webrtcEncryption: no
          rtspAddress: :8554
          authMethod: http
          authHTTPAddress: ${HOST}/api/mediamtx/auth
          paths:
            all_others:
              source: publisher
        '';

        mediamtxImage = pkgs.dockerTools.buildImage {
          name = "mediamtx";
          tag = "latest";
          copyToRoot = pkgs.buildEnv {
            name = "mediamtx-root";
            paths = [
              pkgs.mediamtx
            ];
            pathsToLink = [
              "/bin"
            ];
          };
          config = {
            Cmd = [
              "/bin/mediamtx"
              "${mediamtxConfig}"
            ];
            ExposedPorts = {
              "8554/tcp" = { };
              "8889/tcp" = { };
            };

          };
        };
      in
      {
        packages = {
          mediamtx-image = mediamtxImage;
        };
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_24
            mediamtx
          ];
        };
      }
    );
}
