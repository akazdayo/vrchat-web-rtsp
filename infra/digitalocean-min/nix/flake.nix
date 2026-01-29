{
  description = "NixOS on DigitalOcean + deploy-rs";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
    deploy-rs.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, deploy-rs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in {
    nixosConfigurations.do-1 = nixpkgs.lib.nixosSystem {
      inherit system;
      modules = [
        ./configuration.nix
      ];
    };

    deploy.nodes.do-1 = {
      hostname = "146.190.87.123";
      sshUser = "root";

      profiles.system = {
        user = "root";
        path = deploy-rs.lib.${system}.activate.nixos self.nixosConfigurations.do-1;
      };
    };

    # deploy-rsのチェック用（任意）
    checks = builtins.mapAttrs (_: lib: lib.deployChecks self.deploy) deploy-rs.lib;
  };
}
