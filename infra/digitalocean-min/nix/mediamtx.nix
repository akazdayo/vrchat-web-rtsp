{ pkgs, ... }:
{
  containers.mediamtx = {
    autoStart = true;
    privateNetwork = false;

    config =
      {
        config,
        lib,
        ...
      }:
      let
        authAddress = "https://rtsp.odango.app/api/mediamtx/auth";
      in
      {
        networking.firewall.allowedTCPPorts = [
          8554
        ];
        services.mediamtx = {
          enable = true;
          settings = {
            webrtc = true;
            webrtcAddress = "127.0.0.1:8889";
            webrtcEncryption = true;

            rtspAddress = ":8554";

            authMethod = "http";
            authHTTPAddress = authAddress;

            paths = {
              all_others = {
                source = "publisher";
              };
            };
          };
        };
      };
  };
}
