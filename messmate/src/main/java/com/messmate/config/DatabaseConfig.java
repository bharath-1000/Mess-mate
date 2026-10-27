package com.messmate.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * JDBC Database connection management utility.
 * Reads credentials strictly from environment variables or an untracked local properties file.
 * Never hardcodes production credentials or prints sensitive connection details.
 */
public final class DatabaseConfig {

    private static final String ENV_DB_URL = "MESSMATE_DB_URL";
    private static final String ENV_DB_USER = "MESSMATE_DB_USER";
    private static final String ENV_DB_PASSWORD = "MESSMATE_DB_PASSWORD";
    private static final String LOCAL_PROPS_PATH = "db.local.properties";

    private static final Properties localProps = new Properties();

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            try (InputStream is = DatabaseConfig.class.getClassLoader().getResourceAsStream(LOCAL_PROPS_PATH)) {
                if (is != null) {
                    localProps.load(is);
                }
            } catch (IOException ignored) {
                // Fallback to system environment variables
            }
        } catch (ClassNotFoundException e) {
            throw new ExceptionInInitializerError("MySQL JDBC Driver not found on classpath.");
        }
    }

    private DatabaseConfig() {
    }

    public static Connection getConnection() throws SQLException {
        String url = resolveConfig(ENV_DB_URL, "db.url",
                "jdbc:mysql://localhost:3306/messmate_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8");
        String user = resolveConfig(ENV_DB_USER, "db.user", "messmate_app");
        String password = resolveConfig(ENV_DB_PASSWORD, "db.password", "");

        return DriverManager.getConnection(url, user, password);
    }

    private static String resolveConfig(String envKey, String propKey, String defaultVal) {
        String envVal = System.getenv(envKey);
        if (envVal != null && !envVal.isBlank()) {
            return envVal.trim();
        }
        String propVal = localProps.getProperty(propKey);
        if (propVal != null && !propVal.isBlank()) {
            return propVal.trim();
        }
        return defaultVal;
    }
}
