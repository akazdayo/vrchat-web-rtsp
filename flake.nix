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
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_24
            mediamtx
            terraform
            cf-terraforming
          ];
        };
      }
    );
}
