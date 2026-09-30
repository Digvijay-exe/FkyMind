package ai.flymind;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class ObservationServer extends Thread {
    private final int port;
    private ServerSocket serverSocket;
    private volatile boolean running = true;
    private Socket clientSocket;
    private BufferedReader in;
    private BufferedWriter out;

    public ObservationServer(int port) {
        this.port = port;
    }

    @Override
    public void run() {
        try {
            serverSocket = new ServerSocket(port);
            while (running) {
                Socket socket = serverSocket.accept();
                synchronized (this) {
                    this.clientSocket = socket;
                    this.in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                    this.out = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
                }
                FlyMindMod.LOGGER.info("Client connected to FlyMind bridge: " + socket.getRemoteSocketAddress());
            }
        } catch (IOException e) {
            if (running) {
                FlyMindMod.LOGGER.error("Bridge server socket error", e);
            }
        }
    }

    public synchronized void sendObservationJson(String json) {
        if (out != null) {
            try {
                out.write(json);
                out.write("\n");
                out.flush();
            } catch (IOException e) {
                FlyMindMod.LOGGER.warn("Failed to write observation packet to Python bridge", e);
            }
        }
    }

    public synchronized String readActionJson() throws IOException {
        if (in != null) {
            return in.readLine();
        }
        return null;
    }

    public void stopServer() {
        running = false;
        try {
            if (serverSocket != null) serverSocket.close();
            if (clientSocket != null) clientSocket.close();
        } catch (IOException ignored) {}
    }
}
