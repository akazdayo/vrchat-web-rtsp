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
          8189
        ];
        networking.firewall.allowedUDPPorts = [
          8189
        ];
        services.mediamtx = {
          enable = true;
          settings = {
            webrtc = true;
            webrtcAddress = "0.0.0.0:8889";
            webrtcEncryption = false;
            webrtcAllowOrigin = "https://rtsp.odango.app";
            webrtcLocalUDPAddress = ":8189";
            webrtcLocalTCPAddress = ":8189";
            webrtcAdditionalHosts = [ "webrtc.odango.app" ];

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
